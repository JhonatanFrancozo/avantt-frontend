import { useState } from 'react'
import { c } from '../core/theme'
import { Avatar, BtnPrimary } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { fmtDateShort } from '../core/utils'
import { delayColor, delayHex } from '../core/utils'
import type { Sprint, Project, Member } from '../core/types'

interface Props {
  sprints: Sprint[]
  projects: Project[]
  members: Member[]
  onCreateSprint: () => void
}

export default function SprintsPage({ sprints, projects, members, onCreateSprint }: Props) {
  const [filterProject, setFilterProject] = useState('')
  const filtered = filterProject ? sprints.filter((s) => s.project === filterProject) : sprints

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {projects.map((p) => {
            const active = filterProject === p.name
            return (
              <button key={p.id} onClick={() => setFilterProject(active ? '' : p.name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? p.color : c.border}`, backgroundColor: active ? p.color + '18' : c.surface, color: active ? p.color : c.textSecondary, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.color }} />{p.name}
              </button>
            )
          })}
        </div>
        <BtnPrimary onClick={onCreateSprint}>＋ Nova Sprint</BtnPrimary>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: c.textMuted, fontSize: 13, backgroundColor: c.surface, borderRadius: 10, border: `1px solid ${c.border}` }}>
            Nenhuma sprint encontrada.
          </div>
        )}
        {filtered.map((sprint) => {
          const proj = projects.find((p) => p.name === sprint.project)
          const barColor = delayColor(sprint.daysDelayed === 0 && sprint.progress === 100 ? -1 : sprint.daysDelayed)
          const rawHex = delayHex(sprint.daysDelayed)
          const sprintMembers = members.filter((m) => sprint.team.includes(m.name))
          const daysLeft = sprint.endDate ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000) : null

          return (
            <div key={sprint.id} style={{ backgroundColor: c.surface, border: `1px solid ${sprint.daysDelayed > 0 ? rawHex + '55' : c.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}>
              <div style={{ height: 3, backgroundColor: proj?.color ?? '#4B7BF5' }} />
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>{sprint.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: proj?.color ?? '#9AA3B2' }} />
                      <span style={{ fontSize: 11, color: c.textMuted }}>{sprint.project}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {sprint.daysDelayed > 0 && <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: rawHex + '22', color: barColor }}>+{sprint.daysDelayed}d atraso</span>}
                    {daysLeft !== null && daysLeft >= 0 && sprint.daysDelayed === 0 && <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', backgroundColor: c.blueLight, color: c.blue }}>{daysLeft}d restantes</span>}
                    {sprint.progress === 100 && <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, backgroundColor: c.greenLight, color: c.green }}>Concluída</span>}
                  </div>
                </div>

                {sprint.goal && (
                  <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5, padding: '8px 10px', backgroundColor: c.bg, borderRadius: 7, borderLeft: `3px solid ${proj?.color ?? c.blue}`, transition: 'background-color 0.3s' }}>
                    {sprint.goal}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: c.textSecondary }}>Progresso</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: barColor }}>{sprint.progress}%</span>
                  </div>
                  <ProgressBar value={sprint.progress} color={barColor} height={6} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Total', v: sprint.totalTasks, col: c.textPrimary },
                    { label: 'Feitas', v: sprint.doneTasks, col: c.green },
                    { label: 'Bloq.', v: sprint.blockedTasks, col: sprint.blockedTasks > 0 ? c.red : c.textMuted },
                    { label: 'Abertas', v: sprint.totalTasks - sprint.doneTasks - sprint.blockedTasks, col: c.textSecondary },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center', backgroundColor: c.bg, borderRadius: 7, padding: '7px 4px', transition: 'background-color 0.3s' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: s.col, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sprintMembers.map((m) => <Avatar key={m.id} i={m.avatar} color={m.color} size={26} />)}
                    {sprint.team.length === 0 && <span style={{ fontSize: 11, color: c.textMuted }}>Sem equipe definida</span>}
                  </div>
                  <span style={{ fontSize: 11, color: c.textMuted, fontFamily: 'var(--font-mono)' }}>
                    {fmtDateShort(sprint.startDate)} → {fmtDateShort(sprint.endDate)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



