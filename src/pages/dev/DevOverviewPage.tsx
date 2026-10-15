import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { c, STATUS_META } from '../../theme'
import { DEV_CURRENT_USER } from '../../constants'
import type { Project, Task } from '../../types'

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

const SPRINT_NAME = DEV_CURRENT_USER.sprint

interface WeekItem { id: string; label: string; done?: boolean; isEvent?: boolean }
const WEEK_DAYS: { day: string; date: number; past?: boolean; today?: boolean; urgent?: boolean; items: WeekItem[] }[] = [
  { day: 'Seg', date: 18, past: true, items: [{ id: 'a', label: 'T-215 concluída', done: true }, { id: 'b', label: 'T-218 concluída', done: true }] },
  { day: 'Ter', date: 19, today: true, items: [{ id: 'c', label: 'T-235 em andamento', done: false }, { id: 'd', label: 'T-229 iniciada', done: false }, { id: 'e', label: 'Daily 9h', isEvent: true }] },
  { day: 'Qua', date: 20, items: [{ id: 'f', label: 'T-238 em andamento', done: false }, { id: 'g', label: 'Review Sprint', isEvent: true }] },
  { day: 'Qui', date: 21, urgent: true, items: [{ id: 'h', label: 'T-235 — prazo', done: false }] },
  { day: 'Sex', date: 22, urgent: true, items: [{ id: 'i', label: 'T-241 — prazo', done: false }, { id: 'j', label: 'Planning S19', isEvent: true }] },
]

const PROFILE_METRICS = [
  { label: 'PRs abertas', value: 3, trend: +1, trendLabel: '+1' },
  { label: 'Code Reviews', value: 5, trend: 0, trendLabel: '—' },
  { label: 'Bugs abertos', value: 2, trend: -1, trendLabel: '-1' },
  { label: 'Lead time médio', value: '2.4d', trend: 0, trendLabel: '—' },
  { label: 'Tasks reabertas', value: 1, trend: 0, trendLabel: '—' },
  { label: 'Bloqueios / Sprint', value: 2, trend: +1, trendLabel: '+1' },
]

const INSIGHTS = [
  { color: '#4B7BF5', bg: 'rgba(75,123,245,0.05)', border: 'rgba(75,123,245,0.18)', title: 'Priorização sugerida', text: 'T-235 (bug de autenticação) tem prazo amanhã e está apenas 30% concluída. Priorize antes de iniciar T-229.' },
  { color: '#E07B2A', bg: 'rgba(224,123,42,0.05)', border: 'rgba(224,123,42,0.18)', title: 'Risco de atraso', text: 'T-241 consumiu 7h de 8h estimadas e ainda está 60% concluída. Risco real de ultrapassar estimativa em ~4h.' },
  { color: '#D95050', bg: 'rgba(217,80,80,0.05)', border: 'rgba(217,80,80,0.18)', title: 'Bloqueio prolongado', text: 'T-241 está bloqueada há 2 dias. Cada dia adicional aumenta o risco de não entregar a Sprint no prazo.' },
  { color: '#7C5CDE', bg: 'rgba(124,92,222,0.05)', border: 'rgba(124,92,222,0.18)', title: 'Previsão de Sprint', text: 'Com ritmo atual (~3.2h/dia útil), você deve concluir as tarefas restantes em ~6 dias. Sprint encerra em 7 dias. Margem baixa.' },
  { color: '#37A066', bg: 'rgba(55,160,102,0.05)', border: 'rgba(55,160,102,0.18)', title: 'Tendência de estimativa', text: 'Suas últimas 3 tarefas tiveram média de 15% de estouro em relação à estimativa. Considere ajustar o buffer no próximo planejamento.' },
]

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

function SprintHealth({ tasks }: { tasks: Task[] }) {
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
          <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>{SPRINT_NAME}</div>
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

function NextBestAction({ tasks }: { tasks: Task[] }) {
  const candidate = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'Em andamento' || t.status === 'Planejada')
    return open.find((t) => t.daysDelayed > 0) ?? open.sort((a, b) => new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime())[0]
  }, [tasks])

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
      <button style={{ alignSelf: 'flex-start', padding: '7px 18px', borderRadius: 7, border: `1px solid rgba(75,123,245,0.4)`, background: 'rgba(75,123,245,0.06)', color: '#4B7BF5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Iniciar tarefa
      </button>
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

function MyWeek() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {WEEK_DAYS.map(({ day, date, today, past, urgent, items }) => (
        <div key={date} style={{ backgroundColor: c.surface, border: `2px solid ${today ? '#4B7BF5' : c.border}`, borderRadius: 10, padding: '12px 14px', opacity: past ? 0.6 : 1, transition: 'background-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: c.textMuted }}>{day}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: urgent ? '#D95050' : today ? '#4B7BF5' : c.textSecondary }}>{date}</span>
          </div>
          {today && <div style={{ fontSize: 10, fontWeight: 700, color: '#4B7BF5', marginBottom: 6, letterSpacing: '0.06em' }}>HOJE</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {items.map((item) => (
              <div key={item.id} style={{ fontSize: 11, color: past ? c.textMuted : urgent && !item.isEvent ? '#D95050' : c.textSecondary, textDecoration: past && item.done ? 'line-through' : 'none', padding: '3px 6px', borderRadius: 4, backgroundColor: item.isEvent ? `${c.border}55` : 'transparent' }}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DevOverviewPage({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
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
        <KPICard label="Progresso" value={`${sprintPct}%`} sub={SPRINT_NAME} color={sprintPct >= 70 ? '#37A066' : sprintPct >= 40 ? '#4B7BF5' : '#E07B2A'} />
      </div>

      {/* Sprint Health */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Sprint Health" />
        <SprintHealth tasks={tasks} />
      </section>

      {/* Next Best Action */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Próxima Ação Recomendada" />
        <NextBestAction tasks={tasks} />
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
        <MyWeek />
      </section>

      {/* Profile metrics */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Métricas — Frontend" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {PROFILE_METRICS.map((m) => (
            <div key={m.label} style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'background-color 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: m.trend > 0 ? '#D95050' : m.trend < 0 ? '#37A066' : c.textMuted, fontWeight: 600 }}>{m.trendLabel}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.textPrimary }}>{m.value}</div>
              <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="Insights e Recomendações" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {INSIGHTS.map((ins) => (
            <div key={ins.title} style={{ backgroundColor: ins.bg, border: `1px solid ${ins.border}`, borderLeft: `3px solid ${ins.color}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ins.color }}>{ins.title}</div>
              <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.55 }}>{ins.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
