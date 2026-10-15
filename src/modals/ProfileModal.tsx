import { useState } from 'react'
import * as api from '../api'
import Modal from '../components/Modal'
import { Field, Inp } from '../components/form'
import type { SessionUser } from '../types'
import { formatCpf, formatPhone } from '../utils'

const roleLabels = {
  manager: 'Gestor',
  developer: 'Desenvolvedor',
} as const

export default function ProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: SessionUser
  onClose: () => void
  onSaved: (user: SessionUser) => void
}) {
  const [email, setEmail] = useState(user.email)
  const [cpf, setCpf] = useState(user.cpf ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.')
      return
    }
    if (cpf && cpf.replace(/\D/g, '').length !== 11) {
      setError('O CPF deve conter 11 dígitos.')
      return
    }
    if (newPassword) {
      if (!currentPassword) {
        setError('Informe sua senha atual.')
        return
      }
      if (newPassword.length < 8) {
        setError('A nova senha deve ter pelo menos 8 caracteres.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('A confirmação da nova senha não coincide.')
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      const updated = await api.usuarios.atualizarMeuPerfil({
        email: email.trim().toLowerCase(),
        cpf: cpf || undefined,
        telefone: phone || undefined,
      })
      if (newPassword) {
        await api.usuarios.alterarMinhaSenha({ senhaAtual: currentPassword, novaSenha: newPassword })
      }
      onSaved(updated)
      onClose()
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Meu perfil" onClose={onClose} onSubmit={save} submitLabel={saving ? 'Salvando...' : 'Salvar alterações'} wide>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-text-primary">Informações da conta</div>
            <p className="mt-1 text-xs leading-5 text-text-muted">Consulte seu vínculo e atualize o e-mail utilizado para entrar.</p>
          </div>
          <Field label="Nome">
            <div className="rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-text-secondary">{user.name}</div>
          </Field>
          <Field label="E-mail" required>
            <Inp type="email" value={email} onChange={setEmail} autoComplete="email" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF">
              <Inp value={cpf} onChange={(value) => setCpf(formatCpf(value))} placeholder="000.000.000-00" />
            </Field>
            <Field label="Telefone">
              <Inp value={phone} onChange={(value) => setPhone(formatPhone(value))} placeholder="(00) 00000-0000" />
            </Field>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="text-xs font-semibold text-text-primary">{roleLabels[user.role]}</div>
            <div className="mt-1 text-xs text-text-muted">
              {user.organizationName ?? 'Sem organização vinculada'}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-bg p-5">
          <div>
            <div className="text-sm font-semibold text-text-primary">Alterar senha</div>
            <p className="mt-1 text-xs leading-5 text-text-muted">Deixe os campos vazios para manter a senha atual.</p>
          </div>
          <Field label="Senha atual">
            <Inp type="password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          </Field>
          <Field label="Nova senha">
            <Inp type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          </Field>
          <Field label="Confirmar nova senha">
            <Inp type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          </Field>
        </div>
      </div>
      {error && <div role="alert" className="mt-5 rounded-lg border border-red/20 bg-red-light p-3 text-sm text-red">{error}</div>}
    </Modal>
  )
}
