import { useState, useMemo } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, ColorPicker } from '../components/form'
import { Avatar } from '../components/atoms'
import ProjectPickerRow from '../components/ProjectPickerRow'
import { c } from '../theme'
import { mkInitials } from '../utils'
import { MEMBER_COLORS, ROLES } from '../constants'
import { getApiErrorMessage } from '../api'
import type { Member, MemberSubmission, Project } from '../types'

interface Props {
  projects: Project[]
  onClose: () => void
  onSave: (submission: MemberSubmission) => Promise<void>
}

export default function CreateMemberModal({ projects, onClose, onSave }: Props) {
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [appRole, setAppRole] = useState<'manager' | 'developer'>('developer')
  const [color, setColor] = useState(MEMBER_COLORS[0])
  const [projList, setProjList] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)

  const av = useMemo(() => mkInitials(name || 'NM'), [name])

  function validate() {
    const e: Record<string, string> = {}
    if (mode === 'create' && !name.trim()) e.name = 'Nome obrigatório'
    if (mode === 'create' && !role) e.role = 'Função obrigatória'
    if (mode === 'create' && !appRole) e.appRole = 'Papel obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail válido obrigatório'
    if (mode === 'link' && projList.length === 0) {
      e.projects = 'Selecione pelo menos um projeto para vincular a conta.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    setSaving(true)
    setRequestError('')

    try {
      if (mode === 'link') {
        await onSave({
          mode: 'link',
          email: email.trim().toLowerCase(),
          projectIds: projects
            .filter((project) => projList.includes(project.name))
            .map((project) => project.id),
        })
      } else {
        await onSave({
          mode: 'create',
          member: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role,
            appRole,
            avatar: av,
            color,
            projects: projList,
            projectIds: projects
              .filter((project) => projList.includes(project.name))
              .map((project) => project.id),
            tasks: { total: 0, done: 0, delayed: 0, blocked: 0 },
            workload: 0,
            inviteStatus: 'pending',
            isActive: false,
          },
        })
      }
    } catch (error) {
      setRequestError(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function toggleProject(pname: string) {
    setProjList((pl) => pl.includes(pname) ? pl.filter((x) => x !== pname) : [...pl, pname])
  }

  return (
    <Modal
      title={mode === 'create' ? 'Adicionar Membro' : 'Vincular conta existente'}
      onClose={onClose}
      onSubmit={() => void submit()}
      submitLabel={saving ? 'Salvando...' : mode === 'create' ? 'Convidar' : 'Vincular'}
      wide
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === 'create' ? 'bg-blue text-white' : 'border border-border text-text-secondary'}`}
            >
              Criar novo
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === 'link' ? 'bg-blue text-white' : 'border border-border text-text-secondary'}`}
            >
              Vincular conta existente
            </button>
          </div>

          {mode === 'create' && (
            <>
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
            </>
          )}

          <Field label="E-mail" required error={errors.email}>
            <Inp
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="joao@empresa.com"
            />
          </Field>
          {mode === 'create' && (
            <>
              <Field label="Função" required error={errors.role}>
                <Sel value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="Papel no sistema" required error={errors.appRole}>
                <Sel
                  value={appRole}
                  onChange={(value) => setAppRole(value as 'manager' | 'developer')}
                  options={[
                    { value: 'manager', label: 'Gerente' },
                    { value: 'developer', label: 'Desenvolvedor' },
                  ]}
                />
              </Field>
              <Field label="Cor do avatar">
                <ColorPicker colors={MEMBER_COLORS} value={color} onChange={setColor} />
              </Field>
              <div className="rounded-lg border border-blue/20 bg-blue-light p-3 text-xs leading-5 text-blue">
                O desenvolvedor receberá um convite por e-mail para definir a própria senha.
              </div>
            </>
          )}

          {mode === 'link' && (
            <div className="rounded-lg border border-blue/20 bg-blue-light p-3 text-xs leading-5 text-blue">
              Informe o e-mail usado pelo desenvolvedor no cadastro. Enviaremos o código de primeiro acesso ao associá-lo aos projetos.
            </div>
          )}
        </div>

        <div>
          <Field label="Projetos (atribuição inicial)">
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>O membro pode ser adicionado a projetos já existentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p) => (
                <ProjectPickerRow key={p.id} project={p} selected={projList.includes(p.name)} onToggle={toggleProject} />
              ))}
            </div>
            {errors.projects && (
              <div role="alert" className="mt-2 text-xs text-red">
                {errors.projects}
              </div>
            )}
            {projList.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: c.textMuted }}>
                Será adicionado a {projList.length} projeto{projList.length !== 1 ? 's' : ''}.
              </div>
            )}
          </Field>
        </div>
      </div>
      {requestError && (
        <div role="alert" className="mt-4 rounded-lg bg-red-light p-3 text-sm text-red">
          {requestError}
        </div>
      )}
    </Modal>
  )
}
