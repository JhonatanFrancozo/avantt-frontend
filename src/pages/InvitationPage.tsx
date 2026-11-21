import { useState } from 'react'
import * as api from '../api'
import type { AuthSession } from '../types'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'

interface Props {
  email?: string
  password?: string
  allowPasswordSetup?: boolean
  onAccepted: (session: AuthSession) => void
  onCancel: () => void
}

export default function InvitationPage({
  email: initialEmail = '',
  password: initialPassword = '',
  allowPasswordSetup = false,
  onAccepted,
  onCancel,
}: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [confirmation, setConfirmation] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    const codigoLimpo = codigo.replace(/\D/g, '')

    if (codigoLimpo.length !== 6) {
      setError('Informe o código de seis dígitos enviado para seu e-mail.')
      return
    }
    if (!email.trim() || (allowPasswordSetup && password.length < 8)) {
      setError(
        allowPasswordSetup
          ? 'Informe seu e-mail e defina uma senha com pelo menos 8 caracteres.'
          : 'O e-mail da conta não foi informado.'
      )
      return
    }
    if (allowPasswordSetup && password !== confirmation) {
      setError('As senhas não conferem.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const session = await api.auth.acceptInvitation({
        email,
        password,
        codigo: codigoLimpo,
      })

      onAccepted(session)
    } catch (requestError) {
      const message = api.getApiErrorMessage(requestError)
      setError(
        message === 'Dados de validação inválidos.'
          ? 'O e-mail não corresponde ao convite. Confira o endereço que recebeu o código.'
          : message
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-3 text-xl font-bold text-text-primary">
          Validar primeiro acesso
        </div>

        <p className="mb-5 text-sm leading-6 text-text-muted">
          {allowPasswordSetup
            ? 'Use o código enviado por e-mail para confirmar o convite e criar sua senha.'
            : 'Enviamos um código de validação para o e-mail cadastrado. Informe-o para concluir seu primeiro acesso.'}
        </p>

        {allowPasswordSetup ? (
          <>
            <Field label="E-mail" required>
              <Inp
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                readOnly={Boolean(initialEmail.trim())}
              />
            </Field>
            <Field label="Nova senha" required>
              <Inp
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
              />
            </Field>
            <Field label="Confirmar senha" required>
              <Inp
                type="password"
                value={confirmation}
                onChange={setConfirmation}
                autoComplete="new-password"
              />
            </Field>
          </>
        ) : (
          <div className="mb-5 rounded-lg bg-bg p-3">
            <div className="text-xs text-text-muted">
              Código enviado para
            </div>
            <div className="break-all text-sm font-semibold text-text-primary">
              {email}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Código de validação" required>
            <Inp
              value={codigo}
              onChange={(value) => {
                setCodigo(value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              placeholder="Digite os 6 números"
              type="text"
            />
          </Field>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-light p-3 text-sm text-red"
            >
              {error}
            </div>
          )}

          <BtnPrimary
            onClick={() => void submit()}
            disabled={saving || codigo.length !== 6}
          >
            {saving ? 'Validando...' : 'Validar código'}
          </BtnPrimary>

          <BtnPrimary
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Voltar para o login
          </BtnPrimary>
        </div>
      </section>
    </main>
  )
}