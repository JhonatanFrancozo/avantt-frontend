import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp } from '../components/form'
import ProjectPickerRow from '../components/ProjectPickerRow'
import { c } from '../theme'
import * as api from '../api'
import type { Member, Project } from '../types'

interface Props {
  projects: Project[]
  onClose: () => void
  onSave: (email: string, projectIds: string[]) => Promise<void>
}

export default function CreateMemberModal({ projects, onClose, onSave }: Props) {
  const [email, setEmail] = useState('')
  const [projList, setProjList] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.usuarios.listarUsuariosDisponiveis()
      .then(setMembers)
      .catch((error) => setSaveError(api.getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const matchedMember = members.find((member) =>
    member.email.toLocaleLowerCase('pt-BR') === email.trim().toLocaleLowerCase('pt-BR'))

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'E-mail válido obrigatório'
    } else if (!matchedMember) {
      nextErrors.email = 'Usuário não encontrado pelo e-mail'
    }
    if (projList.length === 0) nextErrors.projects = 'Selecione pelo menos um projeto'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submit() {
    if (!validate()) return
    setSaving(true)
    setSaveError('')
    try {
      const projectIds = projects
        .filter((project) => projList.includes(project.name))
        .map((project) => project.id)
      await onSave(email.trim().toLowerCase(), projectIds)
    } catch (error) {
      setSaveError(api.getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function toggleProject(projectName: string) {
    setProjList((current) =>
      current.includes(projectName)
        ? current.filter((name) => name !== projectName)
        : [...current, projectName])
  }

  return (
    <Modal
      title="Vincular Membro"
      onClose={onClose}
      onSubmit={() => void submit()}
      submitLabel={saving ? 'Vinculando...' : 'Vincular'}
      wide
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 68, padding: '12px 16px', backgroundColor: c.bg, borderRadius: 10, border: `1px solid ${c.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>
                {matchedMember?.name || 'Usuário existente'}
              </div>
              <div style={{ fontSize: 12, color: c.textMuted }}>
                {matchedMember?.role || 'Procure pela conta já cadastrada'}
              </div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                {matchedMember?.email || email || 'email@empresa.com'}
              </div>
            </div>
          </div>

          <Field label="E-mail do usuário" required error={errors.email}>
            <Inp type="email" value={email} onChange={setEmail} placeholder="joao@empresa.com" />
          </Field>
          {loading && <div className="text-xs text-text-muted">Verificando usuários existentes...</div>}
          <div className="rounded-lg border border-blue/20 bg-blue-light p-3 text-xs leading-5 text-blue">
            Um código de primeiro acesso será enviado por e-mail ao usuário vinculado.
          </div>
          {saveError && (
            <div className="rounded-lg border border-red/20 bg-red-light p-3 text-xs text-red">
              {saveError}
            </div>
          )}
        </div>

        <div>
          <Field label="Projetos (atribuição inicial)" error={errors.projects}>
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>
              O usuário será vinculado aos projetos selecionados.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((project) => (
                <ProjectPickerRow
                  key={project.id}
                  project={project}
                  selected={projList.includes(project.name)}
                  onToggle={toggleProject}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
