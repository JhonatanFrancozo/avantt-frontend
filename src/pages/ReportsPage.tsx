import { useMemo } from 'react'
import { c, STATUS_OPTIONS, STATUS_META, PRIORITY_META } from '../theme'
import { Avatar, StatCard } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { BarChart, DonutChart } from '../components/charts'
import { workloadColor, delayColor } from '../utils'
import type { Task, Project, Member, Sprint } from '../types'

interface Props {
  tasks: Task[]
  projects: Project[]
  members: Member[]
  sprints: Sprint[]
}

export default function ReportsPage({ tasks, projects, members, sprints }: Props) {
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
    const doneHours = tasks.filter((t) => t.status === 'concluída').reduce((s, t) => s + t.estimatedHours, 0)
    const delayedTasks = tasks.filter((t) => t.daysDelayed > 0).sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 6)
    const avgDelay = delayedTasks.length ? Math.round(delayedTasks.reduce((s, t) => s + t.daysDelayed, 0) / delayedTasks.length) : 0
    const completionRate = Math.round((tasks.filter((t) => t.status === 'concluída').length / (tasks.length || 1)) * 100)
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
      <div style={{ display: 'flex', gap: 14 }}>
        <StatCard label="Taxa de conclusão" value={`${completionRate}%`} sub={`${tasks.filter((t) => t.status === 'concluída').length} de ${tasks.length} tarefas`} color={c.green} />
        <StatCard label="Tarefas atrasadas" value={delayedTasks.length} sub={`Atraso médio: ${avgDelay} dias`} color={c.red} />
        <StatCard label="Sprints em atraso" value={`${sprintDelayRate}%`} sub={`${sprints.filter((s) => s.daysDelayed > 0).length} de ${sprints.length} sprints`} color={c.amber} />
        <StatCard label="Horas estimadas" value={`${totalHours}h`} sub={`${doneHours}h concluídas (${Math.round((doneHours / (totalHours || 1)) * 100)}%)`} color={c.blue} />
        <StatCard label="Tarefas bloqueadas" value={tasks.filter((t) => t.status === 'bloqueada').length} sub="requerem atenção imediata" color={c.purple} />
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
              const done = tasks.filter((t) => t.project === p.name && t.status === 'concluída').length
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
