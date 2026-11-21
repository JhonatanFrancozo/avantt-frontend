import { useState } from 'react'
import * as api from '../api'
import type { AuthSession } from '../types'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'

export default function InvitationPage({ token, onAccepted }: { token: string; onAccepted: (session: AuthSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!email.trim() || !/^[A-Za-z0-9]{6}$/.test(token.trim()) || password.length < 8 || password !== confirmation) {
      setError('Informe seu e-mail, use o código de 6 dígitos do convite e confirme a senha cadastrada.')
      return
    }
    setSaving(true)
    setError('')
    try {
      onAccepted(await api.auth.acceptInvitation({ token: token.trim(), email: email.trim().toLowerCase(), password }))
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-xl font-bold text-text-primary">Concluir acesso à AVANTT</div>
        <p className="mb-6 text-sm leading-6 text-text-muted">Informe seu e-mail e confirme a senha para validar o código recebido.</p>
        <div className="space-y-4">
        <Field label="E-mail" required><Inp type="email" value={email} onChange={setEmail} placeholder="Seu e-mail cadastrado" /></Field>
          <Field label="Senha" required><Inp type="password" value={password} onChange={setPassword} placeholder="Mínimo de 8 caracteres" /></Field>
          <Field label="Confirmar senha" required><Inp type="password" value={confirmation} onChange={setConfirmation} placeholder="Digite a senha novamente" /></Field>
          {error && <div role="alert" className="rounded-lg bg-red-light p-3 text-sm text-red">{error}</div>}
          <BtnPrimary onClick={() => void submit()}>{saving ? 'Concluindo...' : 'Concluir cadastro'}</BtnPrimary>
        </div>
      </section>
    </main>
  )
}
