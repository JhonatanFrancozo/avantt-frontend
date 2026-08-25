import { useState, useMemo } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, ColorPicker } from '../components/form'
import { Avatar } from '../components/atoms'
import ProjectPickerRow from '../components/ProjectPickerRow'
import { c } from '../core/theme'
import { mkInitials } from '../core/utils'
import { MEMBER_COLORS, ROLES } from '../core/constants'
import type { Member, Project } from '../core/types'

interface Props {
  projects: Project[]
  onClose: () => void
  onSave: (m: Omit<Member, 'id'>) => void
}

export default function CreateMemberModal({ projects, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [color, setColor] = useState(MEMBER_COLORS[0])
  const [projList, setProjList] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const av = useMemo(() => mkInitials(name || 'NM'), [name])

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!role) e.role = 'Função obrigatória'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    onSave({ name: name.trim(), email, role, avatar: av, color, projects: projList, tasks: { total: 0, done: 0, delayed: 0, blocked: 0 }, workload: 0 })
  }

  function toggleProject(pname: string) {
    setProjList((pl) => pl.includes(pname) ? pl.filter((x) => x !== pname) : [...pl, pname])
  }

  return (
    <Modal title="Adicionar Membro" onClose={onClose} onSubmit={submit} submitLabel="Adicionar" wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', backgroundColor: c.bg, borderRadius: 10, border: `1px solid ${c.border}`, transition: 'background-color 0.3s' }}>
            <Avatar i={av} color={color} size={48} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{name || 'Nome do membro'}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{role || 'Função'}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{email || 'email@empresa.com'}</div>
            </div>
          </div>

          <Field label="Nome completo" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: João Oliveira" />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <Inp type="email" value={email} onChange={setEmail} placeholder="joao@empresa.com" />
          </Field>
          <Field label="Função" required error={errors.role}>
            <Sel value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
          </Field>
          <Field label="Cor do avatar">
            <ColorPicker colors={MEMBER_COLORS} value={color} onChange={setColor} />
          </Field>
        </div>

        <div>
          <Field label="Projetos (atribuição inicial)">
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>O membro pode ser adicionado a projetos já existentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p) => (
                <ProjectPickerRow key={p.id} project={p} selected={projList.includes(p.name)} onToggle={toggleProject} />
              ))}
            </div>
            {projList.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: c.textMuted }}>
                Será adicionado a {projList.length} projeto{projList.length !== 1 ? 's' : ''}.
              </div>
            )}
          </Field>
        </div>
      </div>
    </Modal>
  )
}



