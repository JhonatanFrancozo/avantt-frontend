import { useState } from 'react'
import * as api from '../api'
import type { AuthSession } from '../types'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'

export default function InvitationPage({ token, onAccepted }: { token: string; onAccepted: (session: AuthSession) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim() || password.length < 8 || password !== confirmation) {
      setError('Informe seu nome, uma senha com pelo menos 8 caracteres e confirme a mesma senha.')
      return
    }
    setSaving(true)
    setError('')
    try {
      onAccepted(await api.auth.acceptInvitation({ token, name, password }))
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-xl font-bold text-text-primary">Concluir acesso à AVANTT</div>
        <p className="mb-6 text-sm leading-6 text-text-muted">Complete seu cadastro para acessar a empresa convidante.</p>
        <div className="space-y-4">
          <Field label="Nome completo" required><Inp value={name} onChange={setName} placeholder="Como podemos chamar você?" /></Field>
          <Field label="Senha" required><Inp type="password" value={password} onChange={setPassword} placeholder="Mínimo de 8 caracteres" /></Field>
          <Field label="Confirmar senha" required><Inp type="password" value={confirmation} onChange={setConfirmation} placeholder="Digite a senha novamente" /></Field>
          {error && <div role="alert" className="rounded-lg bg-red-light p-3 text-sm text-red">{error}</div>}
          <BtnPrimary onClick={() => void submit()}>{saving ? 'Concluindo...' : 'Concluir cadastro'}</BtnPrimary>
        </div>
      </section>
    </main>
  )
}
