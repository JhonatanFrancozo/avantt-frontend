import { useState, useMemo } from 'react'
import { c } from '../core/theme'
import { Avatar, BtnPrimary, StatCard } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { workloadColor } from '../core/utils'
import EditMemberProjectsModal from '../modals/EditMemberProjectsModal'
import type { Member, Project } from '../core/types'

interface Props {
  members: Member[]
  projects: Project[]
  onAddMember: () => void
  onUpdateMember: (m: Member) => void
}

export default function TeamPage({ members, projects, onAddMember, onUpdateMember }: Props) {
  const [filterProject, setFilterProject] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  const roles = useMemo(() => [...new Set(members.map((m) => m.role))].sort(), [members])

  const filtered = useMemo(() => {
    let r = members
    if (filterProject) r = r.filter((m) => m.projects.includes(filterProject))
    if (filterRole) r = r.filter((m) => m.role === filterRole)
    return [...r].sort((a, b) => b.workload - a.workload)
  }, [members, filterProject, filterRole])

  const avgWorkload = Math.round(members.reduce((s, m) => s + m.workload, 0) / (members.length || 1))

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Projeto', value: filterProject, options: projects.map((p) => ({ value: p.name, label: p.name })), set: setFilterProject },
            { label: 'Função', value: filterRole, options: roles.map((r) => ({ value: r, label: r })), set: setFilterRole },
          ].map(({ label, value, options, set }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
              <select value={value} onChange={(e) => set(e.target.value)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.surface, color: c.textPrimary, fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none' }}>
                <option value="">Todos</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <div style={{ fontSize: 12, color: c.textMuted, alignSelf: 'flex-end', paddingBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.textPrimary }}>{filtered.length}</span> membro{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <BtnPrimary onClick={onAddMember}>＋ Adicionar Membro</BtnPrimary>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="Total de membros" value={members.length} sub="" color={c.blue} icon="◎" />
        <StatCard label="Sobrecarregados" value={members.filter((m) => m.workload >= 85).length} sub="carga ≥ 85%" color={c.red} icon="⚠" />
        <StatCard label="Capacidade média" value={`${avgWorkload}%`} sub="da equipe" color={c.amber} icon="↑" />
        <StatCard label="Projetos ativos" value={projects.length} sub="" color={c.green} icon="▦" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map((m) => (
          <div key={m.id} style={{ backgroundColor: c.surface, border: `1px solid ${m.workload >= 85 ? '#D9505033' : c.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}>
            <div style={{ height: 3, backgroundColor: m.color }} />
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar i={m.avatar} color={m.color} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{m.role}</div>
                  {m.email && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{m.email}</div>}
                </div>
                {m.workload >= 85 && <span style={{ fontSize: 10, fontWeight: 600, color: c.red, backgroundColor: c.redLight, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>SOBRECARR.</span>}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: c.textSecondary }}>Carga de trabalho</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: workloadColor(m.workload) }}>{m.workload}%</span>
                </div>
                <ProgressBar value={m.workload} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { label: 'Total', v: m.tasks.total, col: c.textPrimary },
                  { label: 'Feitas', v: m.tasks.done, col: c.green },
                  { label: 'Atrasadas', v: m.tasks.delayed, col: m.tasks.delayed > 0 ? c.amber : c.textMuted },
                  { label: 'Bloq.', v: m.tasks.blocked, col: m.tasks.blocked > 0 ? c.red : c.textMuted },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', backgroundColor: c.bg, borderRadius: 6, padding: '6px 2px', transition: 'background-color 0.3s' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: s.col, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: c.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Projetos</div>
                {m.projects.length === 0 && <span style={{ fontSize: 12, color: c.textMuted }}>Nenhum projeto atribuído</span>}
                {m.projects.map((pname) => {
                  const proj = projects.find((p) => p.name === pname)
                  return (
                    <div key={pname} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, backgroundColor: c.bg, transition: 'background-color 0.3s' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: proj?.color ?? '#9AA3B2', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: c.textPrimary, flex: 1 }}>{pname}</span>
                      {proj && (
                        <div style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${proj.progress}%`, backgroundColor: proj.color }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button onClick={() => setEditingMember(m)} style={{ padding: '6px 0', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', width: '100%' }}>
                Editar projetos atribuídos
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingMember && (
        <EditMemberProjectsModal
          member={editingMember}
          projects={projects}
          onClose={() => setEditingMember(null)}
          onSave={(updated) => { onUpdateMember(updated); setEditingMember(null) }}
        />
      )}
    </div>
  )
}



