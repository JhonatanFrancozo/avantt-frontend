import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { c, STATUS_META } from '../../theme'
import type { Project, Sprint, Task } from '../../types'
import { getApiErrorMessage } from '../../api'

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}


// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#4B7BF5', flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary, letterSpacing: '-0.01em' }}>{title}</span>
    </div>
  )
}

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'background-color 0.3s' }}>
      <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.textMuted }}>{sub}</div>}
    </div>
  )
}

// ── Sprint Health ─────────────────────────────────────────────────────────────

function SprintHealth({ tasks, sprints }: { tasks: Task[]; sprints: Sprint[] }) {
  if (sprints.length === 0) {
    return (
      <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: '24px', color: c.textMuted, textAlign: 'center', fontSize: 13 }}>
        Nenhuma sprint vinculada aos seus projetos.
      </div>
    )
  }
  const activeSprint = [...sprints].sort((a, b) => b.progress - a.progress)[0]
  const done = tasks.filter((t) => t.status === 'Concluída').length
  const inProg = tasks.filter((t) => t.status === 'Em andamento').length
  const blocked = tasks.filter((t) => t.status === 'Bloqueada').length
  const atRisk = tasks.filter((t) => t.daysDelayed > 0 || (t.hoursSpent ?? 0) > t.estimatedHours).length
  const pct = Math.round((done / tasks.length) * 100)
  const hoursLeft = tasks.filter((t) => t.status !== 'Concluída').reduce((s, t) => s + Math.max(0, t.estimatedHours - (t.hoursSpent ?? 0)), 0)

  const health = blocked > 0 || atRisk > 1 ? 'risco' : pct < 40 ? 'atencao' : 'ritmo'
  const hm = {
    risco:   { label: 'Risco', color: '#D95050', bg: 'rgba(217,80,80,0.08)' },
    atencao: { label: 'Atenção', color: '#E07B2A', bg: 'rgba(224,123,42,0.08)' },
    ritmo:   { label: 'No ritmo', color: '#37A066', bg: 'rgba(55,160,102,0.08)' },
  }[health]

  const barColor = pct >= 70 ? '#37A066' : pct >= 40 ? '#4B7BF5' : '#E07B2A'

  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'background-color 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>{activeSprint.name}</div>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}>Saúde da Sprint</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, backgroundColor: hm.bg, color: hm.color, border: `1px solid ${hm.color}22` }}>{hm.label}</span>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: c.textMuted }}>Progresso</span>
          <span style={{ fontWeight: 600, color: barColor }}>{pct}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, backgroundColor: barColor, transition: 'width 0.4s' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {[
          { label: 'Concluídas', value: done, color: '#37A066' },
          { label: 'Em andamento', value: inProg, color: '#4B7BF5' },
          { label: 'Bloqueadas', value: blocked, color: '#D95050' },
          { label: 'Hrs restantes', value: `${hoursLeft}h`, color: c.textPrimary },
          { label: 'Em risco', value: atRisk, color: '#E07B2A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 8, backgroundColor: c.bg }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: c.textMuted, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Next Best Action ──────────────────────────────────────────────────────────

function NextBestAction({ tasks, onStartTask }: { tasks: Task[]; onStartTask: (task: Task) => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const candidate = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'Em andamento' || t.status === 'Planejada')
    return open.find((t) => t.daysDelayed > 0) ?? open.sort((a, b) => new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime())[0]
  }, [tasks])

  async function startTask() {
    if (!candidate || candidate.status !== 'Planejada') return
    setSaving(true)
    setError('')
    try {
      await onStartTask(candidate)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (!candidate) return null
  const hoursLeft = Math.max(0, candidate.estimatedHours - (candidate.hoursSpent ?? 0))
  const priColor: Record<string, string> = { crítica: '#D95050', alta: '#E07B2A', média: '#4B7BF5', baixa: '#37A066' }

  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid rgba(75,123,245,0.25)`, borderLeft: '3px solid #4B7BF5', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'background-color 0.3s' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#4B7BF5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Próxima ação recomendada</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.textPrimary, lineHeight: 1.3 }}>{candidate.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: c.textSecondary, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: priColor[candidate.priority], display: 'inline-block' }} />
          {candidate.priority}
        </span>
        <span>{hoursLeft}h restantes</span>
        <span>Prazo: {fmtDate(candidate.plannedEnd)}</span>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.textMuted }}>{candidate.project}</span>
      </div>
      <div style={{ fontSize: 12, color: c.textMuted }}>
        {candidate.daysDelayed > 0 ? 'Tarefa em atraso — requer atenção imediata.' : 'Prazo mais próximo entre as tarefas abertas.'}
      </div>
      <button disabled={saving || candidate.status !== 'Planejada'} onClick={() => void startTask()} style={{ alignSelf: 'flex-start', padding: '7px 18px', borderRadius: 7, border: `1px solid rgba(75,123,245,0.4)`, background: 'rgba(75,123,245,0.06)', color: '#4B7BF5', fontSize: 13, fontWeight: 600, cursor: saving || candidate.status !== 'Planejada' ? 'default' : 'pointer', opacity: saving || candidate.status !== 'Planejada' ? 0.6 : 1 }}>
        {candidate.status === 'Planejada' ? (saving ? 'Iniciando...' : 'Iniciar tarefa') : 'Já em andamento'}
      </button>
      {error && <div role="alert" style={{ color: c.red, fontSize: 12 }}>{error}</div>}
    </div>
  )
}

// ── Blockers & Risks ──────────────────────────────────────────────────────────

function BlockersSection({ tasks }: { tasks: Task[] }) {
  const blocked = tasks.filter((t) => t.status === 'Bloqueada')
  const risks = tasks.filter((t) => (t.daysDelayed > 0 || (t.hoursSpent ?? 0) > t.estimatedHours) && t.status !== 'Concluída' && t.status !== 'Bloqueada')

  if (blocked.length === 0 && risks.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: blocked.length > 0 && risks.length > 0 ? '1fr 1fr' : '1fr', gap: 14 }}>
      {blocked.map((t) => (
        <div key={t.id} style={{ backgroundColor: c.surface, border: '1px solid rgba(217,80,80,0.2)', borderLeft: '3px solid #D95050', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'background-color 0.3s' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D95050' }}>{t.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div><span style={{ color: c.textMuted }}>Motivo: </span><span style={{ color: c.textPrimary }}>{t.blockedBy}</span></div>
            <div><span style={{ color: c.textMuted }}>Bloqueada há: </span><span style={{ color: '#D95050', fontWeight: 600 }}>{t.daysDelayed} dias</span></div>
            <div><span style={{ color: c.textMuted }}>Horas restantes: </span><span style={{ color: c.textPrimary }}>{Math.max(0, t.estimatedHours - (t.hoursSpent ?? 0))}h</span></div>
            <div><span style={{ color: c.textMuted }}>Prazo: </span><span style={{ color: '#D95050' }}>{fmtDate(t.plannedEnd)}</span></div>
          </div>
          <div style={{ fontSize: 12, color: '#E07B2A', backgroundColor: 'rgba(224,123,42,0.06)', border: '1px solid rgba(224,123,42,0.15)', padding: '8px 10px', borderRadius: 6 }}>
            Sugestão: solicitar as credenciais ao responsável e escalar no próximo daily.
          </div>
        </div>
      ))}
      {risks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {risks.slice(0, 3).map((t) => {
            const isOver = (t.hoursSpent ?? 0) > t.estimatedHours
            return (
              <div key={t.id} style={{ backgroundColor: c.surface, border: `1px solid ${isOver ? 'rgba(224,123,42,0.2)' : 'rgba(75,123,245,0.2)'}`, borderRadius: 9, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, transition: 'background-color 0.3s' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{t.title}</div>
                <div style={{ fontSize: 11, color: isOver ? '#E07B2A' : '#4B7BF5' }}>
                  {isOver ? `Estouro: ${(t.hoursSpent ?? 0) - t.estimatedHours}h acima do estimado` : `Prazo: ${t.daysDelayed}d de atraso`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Estimated vs Actual ───────────────────────────────────────────────────────

function EstimatedVsActual({ tasks }: { tasks: Task[] }) {
  const data = tasks.map((t) => ({
    name: t.id, estimado: t.estimatedHours, realizado: t.hoursSpent ?? 0,
    over: (t.hoursSpent ?? 0) > t.estimatedHours,
  }))

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
      <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600, color: c.textPrimary, marginBottom: 5 }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name === 'estimado' ? 'Estimado' : 'Realizado'}: {p.value}h</div>)}
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 22px', transition: 'background-color 0.3s' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 16 }}>Estimado × Realizado — por tarefa</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={`${c.border}`} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="estimado" fill="#4B7BF5" radius={[3,3,0,0]} maxBarSize={18} />
          <Bar dataKey="realizado" radius={[3,3,0,0]} maxBarSize={18}>
            {data.map((d, i) => <Cell key={i} fill={d.over ? '#D95050' : '#37A066'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: c.textMuted }}>
        <LegendDot color="#4B7BF5" label="Estimado" />
        <LegendDot color="#37A066" label="Realizado" />
        <LegendDot color="#D95050" label="Estouro" />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, display: 'inline-block' }} />{label}
    </span>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {projects.map((p) => {
        const risk = p.progress < 50 ? { label: 'Risco', color: '#D95050', bg: 'rgba(217,80,80,0.08)' }
          : p.progress < 75 ? { label: 'Atenção', color: '#E07B2A', bg: 'rgba(224,123,42,0.08)' }
          : { label: 'No prazo', color: '#37A066', bg: 'rgba(55,160,102,0.08)' }
        return (
          <div key={p.id} style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'background-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, backgroundColor: risk.bg, color: risk.color, fontWeight: 600 }}>{risk.label}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                <span style={{ color: c.textMuted }}>Progresso</span>
                <span style={{ fontWeight: 600, color: p.color }}>{p.progress}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.progress}%`, borderRadius: 3, backgroundColor: p.color }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.textMuted }}>
              <span>{p.tasks.total} tarefas</span>
              <span>Sprint {p.sprints.done + 1}</span>
            </div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Prazo: {p.endDate.split('-').reverse().join('/')}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── My Week ───────────────────────────────────────────────────────────────────

function MyWeek({ tasks }: { tasks: Task[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return date
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {days.map((date, index) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const dayTasks = tasks.filter((task) => task.plannedEnd === key && task.status !== 'Concluída')
        const isToday = index === 0
        return (
          <div key={key} style={{ backgroundColor: c.surface, border: `1px solid ${isToday ? '#4B7BF5' : c.border}`, borderRadius: 10, padding: '12px 14px', minHeight: 94 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: c.textMuted }}>{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: isToday ? '#4B7BF5' : c.textSecondary }}>{date.getDate()}</span>
            </div>
            {dayTasks.length === 0 ? (
              <div style={{ fontSize: 11, color: c.textMuted }}>Nenhuma entrega prevista</div>
            ) : dayTasks.map((task) => (
              <div key={task.id} style={{ fontSize: 11, color: task.daysDelayed > 0 ? '#D95050' : c.textSecondary, marginBottom: 4 }}>
                {task.id} · {task.title}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DevOverviewPage({ tasks, projects, sprints, onStartTask }: { tasks: Task[]; projects: Project[]; sprints: Sprint[]; onStartTask: (task: Task) => Promise<void> }) {
  const inProgress = tasks.filter((t) => t.status === 'Em andamento').length
  const done = tasks.filter((t) => t.status === 'Concluída').length
  const blocked = tasks.filter((t) => t.status === 'Bloqueada').length
  const totalEstimated = tasks.reduce((s, t) => s + t.estimatedHours, 0)
  const totalSpent = tasks.reduce((s, t) => s + (t.hoursSpent ?? 0), 0)
  const sprintPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const attn = tasks.filter((t) => t.status === 'Bloqueada' || t.daysDelayed > 0)

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Alert banner — no emoji */}
      {attn.length > 0 && (
        <div style={{ backgroundColor: 'rgba(224,123,42,0.06)', border: '1px solid rgba(224,123,42,0.2)', borderLeft: '3px solid #E07B2A', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: c.textPrimary }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#E07B2A" strokeWidth="1.8" strokeLinecap="round"><path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 12v.01"/></svg>
          <span>
            <strong>{attn.length} {attn.length === 1 ? 'tarefa requer' : 'tarefas requerem'} atenção</strong> — {blocked} {blocked === 1 ? 'bloqueada' : 'bloqueadas'}, {tasks.filter((t) => t.daysDelayed > 0).length} em atraso.
          </span>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        <KPICard label="Em andamento" value={inProgress} sub="nesta sprint" color="#4B7BF5" />
        <KPICard label="Concluídas" value={done} sub="nesta sprint" color="#37A066" />
        <KPICard label="Bloqueadas" value={blocked} sub="requerem ação" color="#D95050" />
        <KPICard label="Hrs estimadas" value={`${totalEstimated}h`} sub="total da sprint" color={c.textPrimary} />
        <KPICard label="Hrs realizadas" value={`${totalSpent}h`} sub={totalSpent > totalEstimated ? 'acima do estimado' : 'dentro do plano'} color={totalSpent > totalEstimated ? '#D95050' : c.textPrimary} />
        <KPICard label="Progresso" value={`${sprintPct}%`} sub={sprints[0]?.name ?? 'Sem sprint'} color={sprintPct >= 70 ? '#37A066' : sprintPct >= 40 ? '#4B7BF5' : '#E07B2A'} />
      </div>

      {/* Sprint Health */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Sprint Health" />
        <SprintHealth tasks={tasks} sprints={sprints} />
      </section>

      {/* Next Best Action */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Próxima Ação Recomendada" />
        <NextBestAction tasks={tasks} onStartTask={onStartTask} />
      </section>

      {/* Blockers & Risks */}
      {attn.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionHeader title="Atenção Necessária" />
          <BlockersSection tasks={tasks} />
        </section>
      )}

      {/* My tasks summary table */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Minhas Tarefas" />
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden', transition: 'background-color 0.3s' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                {['ID', 'Título', 'Prioridade', 'Prazo', 'Realizado', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: c.textMuted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => {
                const sm = STATUS_META[t.status]
                const isOver = (t.hoursSpent ?? 0) > t.estimatedHours
                const priColor: Record<string, string> = { crítica: '#D95050', alta: '#E07B2A', média: '#4B7BF5', baixa: '#37A066' }
                return (
                  <tr key={t.id} style={{ borderBottom: i < tasks.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: c.textMuted }}>{t.id}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: c.textPrimary }}>
                      {t.title}
                      {t.blockedBy && <div style={{ fontSize: 11, color: '#D95050', marginTop: 2 }}>{t.blockedBy.slice(0, 55)}…</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: priColor[t.priority] }} />
                        <span style={{ fontSize: 12, color: c.textSecondary }}>{t.priority}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: t.daysDelayed > 0 ? '#D95050' : c.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(t.plannedEnd)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: isOver ? '#E07B2A' : c.textMuted, whiteSpace: 'nowrap' }}>{t.hoursSpent ?? 0}h / {t.estimatedHours}h</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, backgroundColor: sm.bg, color: sm.text, fontWeight: 500 }}>{sm.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Estimated vs Actual */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Estimado × Realizado" />
        <EstimatedVsActual tasks={tasks} />
      </section>

      {/* Projects */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Projetos" />
        <ProjectsSection projects={projects} />
      </section>

      {/* My week */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Minha Semana" />
        <MyWeek tasks={tasks} />
      </section>
    </div>
  )
}
