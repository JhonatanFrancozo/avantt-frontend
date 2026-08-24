import { useState } from 'react'
import { c } from '../theme'
import { Avatar, BtnPrimary } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { fmtDateShort, fmtDate, mkInitials } from '../utils'
import type { Project, Member } from '../types'

interface Props {
  projects: Project[]
  members: Member[]
  onCreateProject: () => void
}

export default function ProjectsPage({ projects, members, onCreateProject }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{projects.length} projetos</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Clique em um projeto para ver detalhes</div>
        </div>
        <BtnPrimary onClick={onCreateProject}>＋ Novo Projeto</BtnPrimary>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
        {projects.map((p) => {
          const isSel = selected === p.id
          return (
            <div key={p.id} onClick={() => setSelected(isSel ? null : p.id)} style={{ backgroundColor: c.surface, border: `1.5px solid ${isSel ? p.color : c.border}`, borderRadius: 12, padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.3s', boxShadow: isSel ? `0 0 0 3px ${p.color}22` : 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: p.color }} />
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>{p.name}</div>
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
                <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 14 }}>Marcos</div>
                {proj.milestones.length === 0 && <div style={{ fontSize: 12, color: c.textMuted }}>Nenhum marco definido.</div>}
                {proj.milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: m.done ? proj.color + '22' : c.border, border: `2px solid ${m.done ? proj.color : c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: m.done ? proj.color : c.textMuted }}>{m.done ? '✓' : '○'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: m.done ? c.textMuted : c.textPrimary, textDecoration: m.done ? 'line-through' : 'none' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: c.textMuted }}>{fmtDate(m.date)}</div>
                    </div>
                    {!m.done && m.date && new Date(m.date) < new Date() && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: c.redLight, color: c.red, fontWeight: 600 }}>ATRASADO</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Riscos</div>
                  {proj.risks.length === 0 && <div style={{ fontSize: 12, color: c.textMuted }}>Nenhum risco identificado.</div>}
                  {proj.risks.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '7px 10px', backgroundColor: c.amberLight, borderRadius: 7, borderLeft: `3px solid ${c.amber}`, fontSize: 12, color: c.textPrimary, marginBottom: 6, transition: 'background-color 0.3s' }}>
                      <span style={{ color: c.amber }}>⚠</span>{r}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Distribuição de Tarefas</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { label: 'Concluídas', v: proj.tasks.done, col: c.green, bg: c.greenLight },
                      { label: 'Atrasadas', v: proj.tasks.delayed, col: c.amber, bg: c.amberLight },
                      { label: 'Bloqueadas', v: proj.tasks.blocked, col: c.red, bg: c.redLight },
                      { label: 'Canceladas', v: proj.tasks.cancelled, col: c.textMuted, bg: c.border },
                      { label: 'Total', v: proj.tasks.total, col: c.textPrimary, bg: c.bg },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center', backgroundColor: s.bg, borderRadius: 8, padding: '10px 6px', transition: 'background-color 0.3s' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: s.col, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                        <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
