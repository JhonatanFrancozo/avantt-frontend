import { useCallback, useEffect, useMemo, useState } from 'react'
import { c, STATUS_OPTIONS, STATUS_META, PRIORITY_META } from '../theme'
import { Avatar, StatCard } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { BarChart, DonutChart } from '../components/charts'
import { workloadColor, delayColor } from '../utils'
import type { Task, Project, Member, Sprint } from '../types'
import type { ProjectMetrics } from '../api/metricas'
import * as api from '../api'
import { Field, Inp, Sel } from '../components/form'
import { BtnPrimary } from '../components/atoms'
import type { EstimateResponse } from '../api/estimativas'

interface Props {
  tasks: Task[]
  projects: Project[]
  members: Member[]
  sprints: Sprint[]
}

function EstimatePanel() {
  const [people, setPeople] = useState('5')
  const [sprintCount, setSprintCount] = useState('4')
  const [deadlineDays, setDeadlineDays] = useState('60')
  const [result, setResult] = useState<EstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function calculate() {
    const pessoas = Number(people)
    const sprints = Number(sprintCount)
    const prazoDias = Number(deadlineDays)
    if (pessoas < 1 || sprints < 1 || prazoDias < 1) {
      setError('Informe valores maiores que zero.')
      return
    }
    setLoading(true)
    setError('')
    try {
      setResult(await api.estimativas.calcularEstimativa({
        pessoas,
        sprints,
        limitePessoas: Math.max(pessoas + 10, 20),
        limiteSprints: Math.max(sprints + 4, 12),
        prazo: prazoDias * 480,
        limiteTempo: prazoDias * 480,
        quantidadeDiasSprint: 15,
      }))
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="grid items-end gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="Pessoas disponíveis">
          <Inp value={people} onChange={setPeople} type="number" />
        </Field>
        <Field label="Quantidade de sprints">
          <Inp value={sprintCount} onChange={setSprintCount} type="number" />
        </Field>
        <Field label="Prazo desejado em dias">
          <Inp value={deadlineDays} onChange={setDeadlineDays} type="number" />
        </Field>
        <BtnPrimary onClick={calculate} disabled={loading}>
          {loading ? 'Calculando...' : 'Calcular previsão'}
        </BtnPrimary>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-light p-3 text-sm text-red">{error}</div>}
      {result && !error && (
        <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-3">
          <div className="rounded-xl bg-bg p-4">
            <div className="text-xs text-text-muted">Tempo estimado</div>
            <div className="mt-2 font-mono text-2xl font-bold text-text-primary">{result.tempoEstimado.toFixed(1)} dias</div>
          </div>
          <div className="rounded-xl bg-bg p-4">
            <div className="text-xs text-text-muted">Situação do prazo</div>
            <div className={`mt-2 text-lg font-bold ${result.dentroPrazo ? 'text-green' : 'text-red'}`}>
              {result.dentroPrazo ? 'Dentro do prazo' : 'Prazo insuficiente'}
            </div>
          </div>
          <div className="rounded-xl bg-bg p-4">
            <div className="text-xs text-text-muted">Cenário recomendado</div>
            <div className="mt-2 text-sm font-semibold leading-6 text-text-primary">{result.melhorMensagem}</div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function ReportsPage({ tasks, projects, members, sprints }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState('')

  useEffect(() => {
    if (!projects.some((project) => String(project.id) === String(selectedProjectId))) {
      setSelectedProjectId(projects[0]?.id ?? '')
    }
  }, [projects, selectedProjectId])

  const loadProjectMetrics = useCallback(async () => {
    if (!selectedProjectId) {
      setProjectMetrics(null)
      return
    }
    setMetricsLoading(true)
    setMetricsError('')
    try {
      setProjectMetrics(await api.metricas.obterMetricasProjeto(selectedProjectId))
    } catch (error) {
      setMetricsError(api.getApiErrorMessage(error))
      setProjectMetrics(null)
    } finally {
      setMetricsLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    void loadProjectMetrics()
  }, [loadProjectMetrics])

  const stats = useMemo(() => {
    const byStatus = STATUS_OPTIONS.map((s) => ({
      label: STATUS_META[s].label,
      value: tasks.filter((t) => t.status === s).length,
      color: STATUS_META[s].dot,
    }))
    const byProject = projects.map((p) => ({
      label: p.name,
      value: tasks.filter((t) => t.project === p.name).length,
      color: p.color,
    }))
    const byPriority = (['crítica', 'alta', 'média', 'baixa'] as const).map((pr) => ({
      label: PRIORITY_META[pr].label,
      value: tasks.filter((t) => t.priority === pr).length,
      color: PRIORITY_META[pr].dot,
    }))
    const byMember = members
      .map((m) => ({ label: m.name.split(' ')[0], value: tasks.filter((t) => t.assignee === m.name).length, color: m.color }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)

    const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0)
    const doneHours = tasks.filter((t) => t.status === 'Concluída').reduce((s, t) => s + t.estimatedHours, 0)
    const delayedTasks = tasks.filter((t) => t.daysDelayed > 0).sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 6)
    const avgDelay = delayedTasks.length ? Math.round(delayedTasks.reduce((s, t) => s + t.daysDelayed, 0) / delayedTasks.length) : 0
    const completionRate = Math.round((tasks.filter((t) => t.status === 'Concluída').length / (tasks.length || 1)) * 100)
    const sprintDelayRate = Math.round((sprints.filter((s) => s.daysDelayed > 0).length / (sprints.length || 1)) * 100)

    return { byStatus, byProject, byPriority, byMember, totalHours, doneHours, delayedTasks, avgDelay, completionRate, sprintDelayRate }
  }, [tasks, projects, members, sprints])

  const workloads = useMemo(
    () => [...members].sort((a, b) => b.workload - a.workload).map((m) => ({ label: m.name.split(' ')[0], value: m.workload, color: workloadColor(m.workload) })),
    [members],
  )

  const { byStatus, byProject, byPriority, byMember, totalHours, doneHours, delayedTasks, avgDelay, completionRate, sprintDelayRate } = stats

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="text-base font-bold text-text-primary">Inteligência do projeto</div>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Indicadores calculados a partir das entregas, prazos e responsáveis do projeto selecionado.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Sel
              value={String(selectedProjectId)}
              onChange={setSelectedProjectId}
              options={projects.map((project) => ({ value: String(project.id), label: project.name }))}
            />
          </div>
        </div>

        {metricsLoading && (
          <div className="grid gap-3 py-6 sm:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-bg" />)}
          </div>
        )}

        {!metricsLoading && metricsError && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-6">
            <div className="text-sm text-red">{metricsError}</div>
            <BtnPrimary variant="secondary" onClick={loadProjectMetrics}>Tentar novamente</BtnPrimary>
          </div>
        )}

        {!metricsLoading && !metricsError && projectMetrics && (
          <>
            <div className="grid gap-3 py-5 sm:grid-cols-3">
              <StatCard label="Taxa de conclusão" value={`${projectMetrics.completionRate}%`} sub="tarefas concluídas no projeto" color={c.green} />
              <StatCard label="Tarefas atrasadas" value={projectMetrics.overdueCount} sub="itens fora do prazo" color={c.red} />
              <StatCard label="Horas estimadas" value={`${projectMetrics.hoursEstimated}h`} sub="esforço planejado" color={c.blue} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Distribuição por status</div>
                <div className="flex items-center gap-4">
                  <DonutChart slices={projectMetrics.statusDistribution.map((item, index) => ({
                    label: item.label,
                    value: item.value,
                    color: STATUS_META[item.label as keyof typeof STATUS_META]?.dot
                      ?? [c.blue, c.green, c.amber, c.red][index % 4],
                  }))} />
                  <div className="min-w-0 flex-1 space-y-2">
                    {projectMetrics.statusDistribution.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-text-secondary">{item.label}</span>
                        <span className="font-mono font-bold text-text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Tarefas por membro</div>
                {projectMetrics.tasksByMember.length
                  ? <BarChart data={projectMetrics.tasksByMember.map((item) => ({ ...item, color: c.blue }))} />
                  : <div className="py-10 text-center text-xs text-text-muted">Nenhuma tarefa atribuída.</div>}
              </div>

              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Maiores atrasos</div>
                <div className="space-y-2">
                  {projectMetrics.topOverdue.map((item) => (
                    <div key={item.id || item.title} className="flex items-center gap-3 rounded-lg bg-surface p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-text-primary">{item.title}</div>
                        <div className="mt-1 text-xs text-text-muted">{item.id}</div>
                      </div>
                      <div className="font-mono text-xs font-bold text-red">+{item.daysDelayed}d</div>
                    </div>
                  ))}
                  {projectMetrics.topOverdue.length === 0 && (
                    <div className="py-10 text-center text-xs text-text-muted">Nenhuma tarefa atrasada.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <div>
        <div className="mb-3 text-base font-bold text-text-primary">Planejamento de capacidade</div>
        <EstimatePanel />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Visão consolidada</div>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <StatCard label="Taxa de conclusão" value={`${completionRate}%`} sub={`${tasks.filter((t) => t.status === 'Concluída').length} de ${tasks.length} tarefas`} color={c.green} />
        <StatCard label="Tarefas atrasadas" value={delayedTasks.length} sub={`Atraso médio: ${avgDelay} dias`} color={c.red} />
        <StatCard label="Sprints em atraso" value={`${sprintDelayRate}%`} sub={`${sprints.filter((s) => s.daysDelayed > 0).length} de ${sprints.length} sprints`} color={c.amber} />
        <StatCard label="Horas estimadas" value={`${totalHours}h`} sub={`${doneHours}h concluídas (${Math.round((doneHours / (totalHours || 1)) * 100)}%)`} color={c.blue} />
        <StatCard label="Tarefas bloqueadas" value={tasks.filter((t) => t.status === 'Bloqueada').length} sub="requerem atenção imediata" color={c.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Distribuição por Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutChart slices={byStatus.map((s) => ({ value: s.value, color: s.color, label: s.label }))} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {byStatus.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: c.textSecondary, flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.textPrimary }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Tarefas por Projeto</div>
          <BarChart data={byProject} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {projects.map((p) => {
              const done = tasks.filter((t) => t.project === p.name && t.status === 'Concluída').length
              const total = tasks.filter((t) => t.project === p.name).length
              const pct = total ? Math.round((done / total) * 100) : 0
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: c.textSecondary }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: p.color }}>{pct}% concluído</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Tarefas por Prioridade</div>
          <BarChart data={byPriority} />
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary, marginBottom: 10 }}>Sprints — Resumo</div>
            {sprints.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: c.textMuted }}>{s.project}</div>
                </div>
                <ProgressBar value={s.progress} color={s.daysDelayed > 0 ? c.red : c.green} height={4} />
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.daysDelayed > 0 ? c.red : c.green, width: 36, textAlign: 'right', flexShrink: 0 }}>{s.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Tarefas por Membro</div>
          <BarChart data={byMember} />
        </div>

        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Carga de Trabalho da Equipe</div>
          <BarChart data={workloads} max={100} />
          <div style={{ marginTop: 14, display: 'flex', gap: 12, fontSize: 11 }}>
            {[{ label: 'Crítico ≥85%', col: '#D95050' }, { label: 'Alto 70-84%', col: '#E07B2A' }, { label: 'Normal <70%', col: '#37A066' }].map((l) => (
              <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: c.textMuted }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.col }} />{l.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px', transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>Tarefas com Maior Atraso</div>
          {delayedTasks.length === 0 && <div style={{ fontSize: 12, color: c.textMuted, padding: '20px 0', textAlign: 'center' }}>Nenhuma tarefa atrasada! ✓</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {delayedTasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: c.bg, borderRadius: 8, transition: 'background-color 0.3s' }}>
                <Avatar i={t.avatar} color={t.avatarColor} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: c.textMuted }}>{t.assignee.split(' ')[0]} · {t.project}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delayColor(t.daysDelayed), flexShrink: 0 }}>+{t.daysDelayed}d</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
