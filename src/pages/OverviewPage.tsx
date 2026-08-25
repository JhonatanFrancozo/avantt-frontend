import { useState, useMemo } from 'react'
import { c } from '../core/theme'
import { Avatar, Badge, PriorityDot, StatCard } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { fmtDateShort } from '../core/utils'
import { delayColor, delayHex } from '../core/utils'
import { PRIORITY_ORDER } from '../core/constants'
import type { Task, Sprint, Member } from '../core/types'

interface Props {
  tasks: Task[]
  sprints: Sprint[]
  members: Member[]
}

export default function OverviewPage({ tasks, sprints, members }: Props) {
  const [tab, setTab] = useState<'tasks' | 'team'>('tasks')
  const [sortKey, setSortKey] = useState<'daysDelayed' | 'priority'>('daysDelayed')

  const delayed = useMemo(() => tasks.filter((t) => t.daysDelayed > 0), [tasks])
  const blocked = useMemo(() => tasks.filter((t) => t.status === 'bloqueada'), [tasks])

  const sorted = useMemo(() => {
    return [...delayed].sort((a, b) => {
      if (sortKey === 'daysDelayed') return b.daysDelayed - a.daysDelayed
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    })
  }, [delayed, sortKey])

  const sprintsDelayed = sprints.filter((s) => s.daysDelayed > 0).length
  const overloaded = members.filter((m) => m.workload >= 85).length

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {(blocked.length > 0 || overloaded > 0) && (
        <div style={{ backgroundColor: c.amberLight, border: `1px solid ${c.amber}33`, borderLeft: `3px solid ${c.amber}`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: c.textPrimary, transition: 'background-color 0.3s' }}>
          <span>⚠️</span>
          <span>
            <strong>{blocked.length} tarefa{blocked.length !== 1 ? 's' : ''} bloqueada{blocked.length !== 1 ? 's' : ''}</strong>
            {overloaded > 0 && <> · <strong>{overloaded} membro{overloaded !== 1 ? 's' : ''} sobrecarregado{overloaded !== 1 ? 's' : ''}</strong></>}
            {' '}— atenção necessária hoje.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14 }}>
        <StatCard label="Tarefas Atrasadas" value={delayed.length} sub="em todos os projetos" color={c.red} icon="⏰" />
        <StatCard label="Sprints em Atraso" value={`${sprintsDelayed}/${sprints.length}`} sub={`Pior: +${Math.max(0, ...sprints.map((s) => s.daysDelayed))}d`} color={c.amber} icon="🏃" />
        <StatCard label="Membros Sobrecarregados" value={overloaded} sub={`de ${members.length} na equipe`} color={c.purple} icon="👤" />
        <StatCard label="Total de Tarefas" value={tasks.length} sub={`${tasks.filter((t) => t.status === 'concluída').length} concluídas`} color={c.blue} icon="✓" />
      </div>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary, margin: '0 0 12px' }}>Status dos Sprints</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[...sprints].sort((a, b) => b.daysDelayed - a.daysDelayed).map((s, i) => {
            const barColor = delayColor(s.daysDelayed)
            const rawHex = delayHex(s.daysDelayed)
            const sprintMembers = members.filter((m) => s.team.includes(m.name))
            return (
              <div key={s.id} style={{ backgroundColor: c.surface, border: `1px solid ${i === 0 ? '#E07B2A55' : c.border}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden', transition: 'background-color 0.3s' }}>
                {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#E07B2A' }} />}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{s.name} — {s.project}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{fmtDateShort(s.startDate)} → {fmtDateShort(s.endDate)}</div>
                  </div>
                  <span style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: rawHex + '22', color: barColor }}>+{s.daysDelayed}d</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: c.textSecondary }}>Progresso</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: barColor, fontFamily: 'var(--font-mono)' }}>{s.progress}%</span>
                  </div>
                  <ProgressBar value={s.progress} color={barColor} height={5} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.textMuted }}>
                  <span><span style={{ color: c.textPrimary, fontWeight: 600 }}>{s.doneTasks}</span>/{s.totalTasks} tarefas</span>
                  {s.blockedTasks > 0 && <span style={{ color: c.red }}>· {s.blockedTasks} bloqueada{s.blockedTasks !== 1 ? 's' : ''}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {sprintMembers.map((m) => <Avatar key={m.id} i={m.avatar} color={m.color} size={24} />)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${c.border}`, marginBottom: 16 }}>
          {([{ key: 'tasks', label: 'Tarefas Atrasadas' }, { key: 'team', label: 'Equipe' }] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? c.blue : c.textSecondary, backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.key ? c.blue : 'transparent'}`, cursor: 'pointer', marginBottom: -1, fontFamily: 'var(--font-sans)' }}>{t.label}</button>
          ))}
        </div>

        {tab === 'tasks' && (
          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden', transition: 'background-color 0.3s' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{delayed.length} tarefas com atraso</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['daysDelayed', 'priority'] as const).map((k) => (
                  <button key={k} onClick={() => setSortKey(k)} style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${sortKey === k ? c.blue : c.border}`, backgroundColor: sortKey === k ? c.blueLight : c.surface, color: sortKey === k ? c.blue : c.textSecondary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {k === 'daysDelayed' ? 'Por atraso' : 'Por prioridade'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: c.bg }}>
                    {['ID','Tarefa','Responsável','Prioridade','Status','Atraso'].map((h) => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((task, i) => (
                    <tr key={task.id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${c.border}` : 'none' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = c.bg)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '11px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textMuted }}>{task.id}</td>
                      <td style={{ padding: '11px 14px', minWidth: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>{task.title}</div>
                        {task.blockedBy && <div style={{ fontSize: 11, color: c.red, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><span>⚠</span>{task.blockedBy}</div>}
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar i={task.avatar} color={task.avatarColor} size={26} />
                          <span style={{ fontSize: 12, color: c.textPrimary }}>{task.assignee}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}><PriorityDot priority={task.priority} /></td>
                      <td style={{ padding: '11px 14px' }}><Badge status={task.status} /></td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delayColor(task.daysDelayed) }}>+{task.daysDelayed}d</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {[...members].sort((a, b) => b.workload - a.workload).map((m) => (
              <div key={m.id} style={{ backgroundColor: c.surface, border: `1px solid ${m.workload >= 85 ? '#D9505022' : c.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'background-color 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar i={m.avatar} color={m.color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: c.textMuted }}>{m.role}</div>
                  </div>
                  {m.workload >= 85 && <span style={{ fontSize: 10, fontWeight: 600, color: c.red, backgroundColor: c.redLight, padding: '2px 6px', borderRadius: 4 }}>SOBRECARR.</span>}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
                    <span style={{ color: c.textSecondary }}>Carga</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: m.workload >= 85 ? c.red : m.workload >= 70 ? c.amber : c.green }}>{m.workload}%</span>
                  </div>
                  <ProgressBar value={m.workload} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ label: 'Feitas', v: m.tasks.done, col: c.textPrimary },{ label: 'Atrasadas', v: m.tasks.delayed, col: m.tasks.delayed > 0 ? c.amber : c.textPrimary },{ label: 'Bloq.', v: m.tasks.blocked, col: m.tasks.blocked > 0 ? c.red : c.textPrimary }].map((s) => (
                    <div key={s.label} style={{ flex: 1, textAlign: 'center', backgroundColor: c.bg, borderRadius: 6, padding: '6px 4px', fontSize: 11, transition: 'background-color 0.3s' }}>
                      <div style={{ fontWeight: 700, color: s.col, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{s.v}</div>
                      <div style={{ color: c.textMuted, marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}



