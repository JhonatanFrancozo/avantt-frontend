import { useState } from 'react'
import { c } from '../theme'
import { Avatar } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { fmtDateShort, fmtDate, mkInitials } from '../utils'
import type { Project, Member } from '../types'
import { EmptyState } from '../components/layout'

interface Props {
  projects: Project[]
  members: Member[]
  onEditProject?: (project: Project) => void
}

export default function ProjectsPage({ projects, members, onEditProject }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{projects.length} projetos</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Clique em um projeto para ver detalhes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
        {projects.length === 0 && (
          <EmptyState
            title="Nenhum projeto cadastrado"
            description="Crie o primeiro projeto para começar a organizar sprints, tarefas e equipe."
          />
        )}
        {projects.map((p) => {
          const isSel = selected === p.id
          return (
            <div key={p.id} onClick={() => setSelected(isSel ? null : p.id)} style={{ backgroundColor: c.surface, border: `1.5px solid ${isSel ? p.color : c.border}`, borderRadius: 12, padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.3s', boxShadow: isSel ? `0 0 0 3px ${p.color}22` : 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: p.color }} />
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>{p.name}</div>
                {p.clientName && <div style={{ fontSize: 10, color: p.color, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.clientName}</div>}
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.5 }}>{p.description || 'Sem descrição'}</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: c.textSecondary }}>Progresso</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: p.color }}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} color={p.color} height={6} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, fontSize: 11 }}>
                {[
                  { label: 'Sprints', v: `${p.sprints.done}/${p.sprints.total}`, color: c.textPrimary },
                  { label: 'Tarefas', v: `${p.tasks.done}/${p.tasks.total}`, color: c.textPrimary },
                  { label: 'Atrasadas', v: p.tasks.delayed, color: p.tasks.delayed > 0 ? c.amber : c.textPrimary },
                  { label: 'Bloqueadas', v: p.tasks.blocked, color: p.tasks.blocked > 0 ? c.red : c.textPrimary },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', backgroundColor: c.bg, borderRadius: 6, padding: '6px 4px', transition: 'background-color 0.3s' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                    <div style={{ color: c.textMuted, marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {p.team.slice(0, 5).map((name) => {
                    const m = members.find((x) => x.name === name)
                    return m ? <Avatar key={name} i={m.avatar} color={m.color} size={24} /> : <Avatar key={name} i={mkInitials(name)} color="#9AA3B2" size={24} />
                  })}
                  {p.team.length > 5 && <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: c.textMuted }}>+{p.team.length - 5}</div>}
                </div>
                <span style={{ fontSize: 11, color: c.textMuted }}>{fmtDateShort(p.startDate)} → {fmtDateShort(p.endDate)}</span>
              </div>

              <div style={{ fontSize: 11, color: p.color, fontWeight: 500 }}>{isSel ? '▲ Ocultar' : '▼ Ver detalhes'}</div>
                {isSel && onEditProject && <button onClick={(event) => { event.stopPropagation(); onEditProject(p) }} style={{ alignSelf: 'flex-start', border: `1px solid ${c.border}`, background: c.bg, color: c.textSecondary, borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>Editar projeto</button>}
            </div>
          )
        })}
      </div>

      {selected && (() => {
        const proj = projects.find((p) => p.id === selected)
        if (!proj) return null
        return (
          <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden', transition: 'background-color 0.3s' }}>
            <div style={{ height: 4, backgroundColor: proj.color }} />
            <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Informações do projeto</div>
                <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                  <div><strong style={{ color: c.textMuted, fontSize: 11 }}>Cliente: </strong><span style={{ color: proj.color, fontWeight: 700, marginLeft: 8 }}>{proj.clientName ?? 'Nenhum cliente associado'}</span></div>
                  <div><strong style={{ color: c.textMuted, fontSize: 11 }}>Status: </strong><span style={{ marginLeft: 8, color: c.textPrimary, fontWeight: 600 }}>{proj.status}</span></div>
                  <div><strong style={{ color: c.textMuted, fontSize: 11 }}>Período: </strong><span style={{ marginLeft: 8, color: c.textPrimary }}>{fmtDate(proj.startDate)} → {fmtDate(proj.endDate)}</span></div>
                  <div style={{ marginTop: 8 }}><strong style={{ color: c.textMuted, fontSize: 11 }}>Descrição</strong>
                    <div style={{ marginTop: 6, color: c.textSecondary, fontSize: 12 }}>{proj.description || 'Sem descrição'}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Equipe</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {proj.team.map((name) => {
                    const member = members.find((item) => item.name === name)
                    return member
                      ? <Avatar key={name} i={member.avatar} color={member.color} size={34} />
                      : <Avatar key={name} i={mkInitials(name)} color="#9AA3B2" size={34} />
                  })}
                  {proj.team.length === 0 && <div style={{ fontSize: 12, color: c.textMuted }}>Sem equipe definida</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 8 }}>Resumo de tarefas</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { label: 'Concluídas', v: proj.tasks.done, col: c.green, bg: c.greenLight },
                    { label: 'Atrasadas', v: proj.tasks.delayed, col: c.amber, bg: c.amberLight },
                    { label: 'Bloqueadas', v: proj.tasks.blocked, col: c.red, bg: c.redLight },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: 'center', backgroundColor: stat.bg, borderRadius: 8, padding: '10px 6px' }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: stat.col, fontFamily: 'var(--font-mono)' }}>{stat.v}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
