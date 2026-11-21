import { useCallback, useEffect, useMemo, useState } from 'react'
import { c, STATUS_META, STATUS_OPTIONS, PRIORITY_META } from '../theme'
import { Avatar, StatCard, BtnPrimary, ProgressBar } from '../components/atoms'
import { BarChart, DonutChart } from '../components/charts'
import { Sel } from '../components/form'
import type { Task, Project, Member, Sprint } from '../types'
import type { ProjectMetrics } from '../api/metricas'
import type { EstimateResponse } from '../api/estimativas'
import * as api from '../api'

interface Props {
  tasks: Task[]
  projects: Project[]
  members: Member[]
  sprints: Sprint[]
  mode?: 'manager' | 'developer'
}

export default function ReportsPage({
  tasks,
  projects,
  members,
  sprints,
  mode = 'manager',
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState('')
  const [availablePeople, setAvailablePeople] = useState('5')
  const [plannedSprints, setPlannedSprints] = useState('4')
  const [desiredDeadline, setDesiredDeadline] = useState('60')
  const [capacityEstimate, setCapacityEstimate] = useState<EstimateResponse | null>(null)
  const [capacityLoading, setCapacityLoading] = useState(false)
  const [capacityError, setCapacityError] = useState('')

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
    const project = projects.find((item) => String(item.id) === String(selectedProjectId))
    const projectTasks = project
      ? tasks.filter((task) => task.project === project.name)
      : []
    const completed = projectTasks.filter((task) => task.status === 'Concluída').length
    setProjectMetrics({
      completionRate: Math.round((completed / (projectTasks.length || 1)) * 100),
      overdueCount: projectTasks.filter((task) => task.daysDelayed > 0).length,
      hoursEstimated: projectTasks.reduce((total, task) => total + task.estimatedHours, 0),
      statusDistribution: STATUS_OPTIONS.map((status) => ({
        label: STATUS_META[status].label,
        value: projectTasks.filter((task) => task.status === status).length,
      })),
      tasksByMember: members
        .map((member) => ({
          label: member.name,
          value: projectTasks.filter((task) => task.assignee === member.name).length,
        }))
        .filter((item) => item.value > 0),
      topOverdue: projectTasks
        .filter((task) => task.daysDelayed > 0)
        .sort((a, b) => b.daysDelayed - a.daysDelayed)
        .slice(0, 5)
        .map((task) => ({ id: task.id, title: task.title, daysDelayed: task.daysDelayed })),
    })
    setMetricsLoading(false)
  }, [selectedProjectId, projects, tasks, members])

  useEffect(() => {
    if (mode === 'manager' && selectedProjectId) void loadProjectMetrics()
  }, [loadProjectMetrics, mode, selectedProjectId])

  const completionRate = useMemo(
    () => Math.round((tasks.filter((task) => task.status === 'Concluída').length / (tasks.length || 1)) * 100),
    [tasks],
  )
  const delayedTasks = useMemo(
    () => tasks.filter((task) => task.daysDelayed > 0).sort((a, b) => b.daysDelayed - a.daysDelayed),
    [tasks],
  )
  const blockedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'Bloqueada'),
    [tasks],
  )
  const totalHours = useMemo(
    () => tasks.reduce((total, task) => total + task.estimatedHours, 0),
    [tasks],
  )
  const doneHours = useMemo(
    () => tasks
      .filter((task) => task.status === 'Concluída')
      .reduce((total, task) => total + task.estimatedHours, 0),
    [tasks],
  )
  const delayedSprints = sprints.filter((sprint) => sprint.daysDelayed > 0)
  const sprintDelayRate = Math.round((delayedSprints.length / (sprints.length || 1)) * 100)
  const averageTaskDelay = delayedTasks.length
    ? Math.round(delayedTasks.reduce((total, task) => total + task.daysDelayed, 0) / delayedTasks.length)
    : 0
  const completedHoursRate = Math.round((doneHours / (totalHours || 1)) * 100)

  async function calculateCapacity() {
    const people = Number(availablePeople)
    const sprintCount = Number(plannedSprints)
    const deadlineDays = Number(desiredDeadline)
    if (![people, sprintCount, deadlineDays].every((value) => Number.isInteger(value) && value > 0)) {
      setCapacityError('Informe quantidades inteiras maiores que zero.')
      return
    }

    setCapacityLoading(true)
    setCapacityError('')
    try {
      const estimate = await api.estimativas.calcularEstimativa({
        pessoas: people,
        sprints: sprintCount,
        prazo: deadlineDays * 480,
        limitePessoas: 30,
        limiteSprints: 15,
        limiteTempo: 144000,
        quantidadeDiasSprint: 15,
      })
      setCapacityEstimate(estimate)
    } catch (error) {
      setCapacityError(api.getApiErrorMessage(error))
    } finally {
      setCapacityLoading(false)
    }
  }

  const byStatus = STATUS_OPTIONS.map((status) => ({
    label: STATUS_META[status].label,
    value: tasks.filter((task) => task.status === status).length,
    color: STATUS_META[status].dot,
  }))
  const byPriority = (['crítica', 'alta', 'média', 'baixa'] as const).map((priority) => ({
    label: PRIORITY_META[priority].label,
    value: tasks.filter((task) => task.priority === priority).length,
    color: PRIORITY_META[priority].dot,
  }))

  if (mode === 'developer') {
    return (
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#4B7BF5' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.textPrimary }}>Minha visão consolidada</div>
            <div style={{ fontSize: 12, color: c.textMuted }}>Indicadores personalizados das suas tarefas e entregas</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Taxa de conclusão" value={`${completionRate}%`} sub={`${tasks.filter((task) => task.status === 'Concluída').length} de ${tasks.length} tarefas`} color={c.green} />
          <StatCard label="Em atraso" value={delayedTasks.length} sub="tarefas fora do prazo" color={c.red} />
          <StatCard label="Bloqueadas" value={blockedTasks.length} sub="requerem ação" color={c.purple} />
          <StatCard label="Horas estimadas" value={`${totalHours}h`} sub={`${doneHours}h concluídas`} color={c.blue} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Meu status de tarefas</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <DonutChart slices={byStatus.map((item) => ({ value: item.value, color: item.color, label: item.label }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {byStatus.map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ flex: 1, fontSize: 11, color: c.textSecondary }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.textPrimary }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Minhas prioridades</div>
            <BarChart data={byPriority} />
          </div>

          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>Atrasos e bloqueios</div>
            {delayedTasks.length === 0 && blockedTasks.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: c.textMuted }}>
                Nenhum atraso ou bloqueio nas suas tarefas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks
                  .filter((task) => task.daysDelayed > 0 || task.status === 'Bloqueada')
                  .slice(0, 6)
                  .map((task) => (
                    <div key={task.id} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: c.bg }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{task.title}</div>
                      <div style={{ marginTop: 3, fontSize: 10, color: task.status === 'Bloqueada' ? c.red : c.amber }}>
                        {task.status === 'Bloqueada' ? 'Bloqueada' : `+${task.daysDelayed} dias`}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {tasks.length > 0 && (
          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>Suas próximas entregas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...tasks]
                .filter((task) => task.status !== 'Concluída')
                .sort((a, b) => String(a.plannedEnd).localeCompare(String(b.plannedEnd)))
                .slice(0, 8)
                .map((task) => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, backgroundColor: c.bg }}>
                    <Avatar i={task.avatar} color={task.avatarColor} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{task.title}</div>
                      <div style={{ fontSize: 10, color: c.textMuted }}>{task.project}</div>
                    </div>
                    <span style={{ fontSize: 11, color: c.textMuted }}>{task.plannedEnd}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="text-base font-bold text-text-primary">Inteligência do projeto</div>
            <p className="mt-1 text-xs text-text-muted">Indicadores calculados a partir das entregas e responsáveis do projeto selecionado.</p>
          </div>
          <div className="w-full sm:w-72">
            <Sel
              value={String(selectedProjectId)}
              onChange={setSelectedProjectId}
              options={projects.map((project) => ({ value: String(project.id), label: project.name }))}
            />
          </div>
        </div>
        {metricsLoading ? (
          <div className="py-8 text-sm text-text-muted">Carregando indicadores...</div>
        ) : metricsError ? (
          <div className="flex items-center justify-between gap-3 py-6">
            <div className="text-sm text-red">{metricsError}</div>
            <BtnPrimary variant="secondary" onClick={loadProjectMetrics}>Tentar novamente</BtnPrimary>
          </div>
        ) : projectMetrics ? (
          <>
            <div className="grid gap-3 py-5 sm:grid-cols-3">
              <StatCard label="Taxa de conclusão" value={`${projectMetrics.completionRate}%`} sub="tarefas concluídas no projeto" color={c.green} />
              <StatCard label="Tarefas atrasadas" value={projectMetrics.overdueCount} sub="itens fora do prazo" color={c.red} />
              <StatCard label="Horas estimadas" value={`${projectMetrics.hoursEstimated}h`} sub="esforço planejado" color={c.blue} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Distribuição por status</div>
                <DonutChart slices={projectMetrics.statusDistribution.map((item, index) => ({
                  label: item.label,
                  value: item.value,
                  color: STATUS_META[item.label as keyof typeof STATUS_META]?.dot ?? [c.blue, c.green, c.amber, c.red][index % 4],
                }))} />
              </div>
              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Tarefas por membro</div>
                {projectMetrics.tasksByMember.length
                  ? <BarChart data={projectMetrics.tasksByMember.map((item) => ({ ...item, color: c.blue }))} />
                  : <div className="py-10 text-center text-xs text-text-muted">Nenhuma tarefa atribuída.</div>}
              </div>
              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="mb-4 text-sm font-semibold text-text-primary">Maiores atrasos</div>
                {projectMetrics.topOverdue.length === 0 ? (
                  <div className="py-10 text-center text-xs text-text-muted">Nenhuma tarefa atrasada.</div>
                ) : projectMetrics.topOverdue.map((item) => (
                  <div key={item.id || item.title} className="flex items-center gap-3 rounded-lg bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-text-primary">{item.title}</div>
                    </div>
                    <div className="font-mono text-xs font-bold text-red">+{item.daysDelayed}d</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section aria-labelledby="capacity-planning-title">
        <h2 id="capacity-planning-title" className="mb-3 text-sm font-bold text-text-primary">Planejamento de capacidade</h2>
        <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto] xl:items-end">
          <label className="block text-xs text-text-secondary">
            Pessoas disponíveis
            <input
              type="number"
              min={1}
              max={30}
              value={availablePeople}
              onChange={(event) => { setAvailablePeople(event.target.value); setCapacityEstimate(null) }}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-blue"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Quantidade de sprints
            <input
              type="number"
              min={1}
              max={15}
              value={plannedSprints}
              onChange={(event) => { setPlannedSprints(event.target.value); setCapacityEstimate(null) }}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-blue"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Prazo desejado em dias
            <input
              type="number"
              min={1}
              max={300}
              value={desiredDeadline}
              onChange={(event) => { setDesiredDeadline(event.target.value); setCapacityEstimate(null) }}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-blue"
            />
          </label>
          <BtnPrimary onClick={calculateCapacity} disabled={capacityLoading}>
            {capacityLoading ? 'Calculando...' : 'Calcular previsão'}
          </BtnPrimary>
        </div>
        {capacityError && <p role="alert" className="mt-2 text-sm text-red">{capacityError}</p>}
        {capacityEstimate && (
          <div role="status" className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="font-semibold text-text-primary">
              Previsão: {capacityEstimate.tempoEstimado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias
              <span className={capacityEstimate.dentroPrazo ? 'ml-2 text-green' : 'ml-2 text-red'}>
                {capacityEstimate.dentroPrazo ? 'Dentro do prazo desejado' : 'Fora do prazo desejado'}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">{capacityEstimate.melhorMensagem}</p>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Taxa de conclusão" value={`${completionRate}%`} sub={`${tasks.filter((task) => task.status === 'Concluída').length} de ${tasks.length} tarefas`} color={c.green} />
        <StatCard label="Tarefas atrasadas" value={delayedTasks.length} sub={`Atraso médio: ${averageTaskDelay} dias`} color={c.red} />
        <StatCard label="Sprints em atraso" value={`${sprintDelayRate}%`} sub={`${delayedSprints.length} de ${sprints.length} sprints`} color={c.amber} />
        <StatCard label="Horas estimadas" value={`${totalHours}h`} sub={`${doneHours}h concluídas (${completedHoursRate}%)`} color={c.blue} />
        <StatCard label="Tarefas bloqueadas" value={blockedTasks.length} sub="requerem atenção imediata" color={c.purple} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Visão consolidada</div>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Distribuição por status</div>
          <DonutChart slices={byStatus.map((item) => ({ value: item.value, color: item.color, label: item.label }))} />
        </div>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Tarefas por projeto</div>
          <BarChart data={projects.map((project) => ({
            label: project.name,
            value: tasks.filter((task) => task.project === project.name).length,
            color: project.color,
          }))} />
        </div>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Tarefas por prioridade</div>
          <BarChart data={byPriority} />
        </div>
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Sprints — Resumo</div>
          {sprints.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...sprints]
                .sort((a, b) => b.daysDelayed - a.daysDelayed)
                .slice(0, 6)
                .map((sprint) => (
                  <div key={sprint.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sprint.name} · {sprint.project}
                      </span>
                      <span style={{ fontSize: 11, color: sprint.daysDelayed > 0 ? c.red : c.textMuted, flexShrink: 0 }}>
                        {sprint.daysDelayed > 0 ? `+${sprint.daysDelayed} dias` : `${sprint.progress}%`}
                      </span>
                    </div>
                    <ProgressBar value={sprint.progress} color={sprint.daysDelayed > 0 ? c.red : c.blue} height={6} />
                    <div style={{ marginTop: 4, fontSize: 10, color: c.textMuted }}>
                      {sprint.doneTasks} de {sprint.totalTasks} tarefas concluídas · {sprint.blockedTasks} bloqueadas
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">Nenhuma sprint cadastrada.</div>
          )}
        </div>
      </div>
    </div>
  )
}
