import { useState } from 'react'
import * as api from '../api'
import type { AuthSession } from '../types'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'

interface Props {
  email: string
  password: string
  onAccepted: (session: AuthSession) => void
  onCancel: () => void
}

export default function InvitationPage({
  email,
  password,
  onAccepted,
  onCancel,
}: Props) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    const codigoLimpo = codigo.replace(/\D/g, '')

    if (codigoLimpo.length !== 6) {
      setError('Informe o código de seis dígitos enviado para seu e-mail.')
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
      setError(api.getApiErrorMessage(requestError))
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
          Enviamos um código de validação para o e-mail cadastrado.
          Informe o código abaixo para concluir seu primeiro acesso à AVANTT.
        </p>

        <div className="mb-5 rounded-lg bg-bg p-3">
          <div className="text-xs text-text-muted">
            Código enviado para
          </div>
          <div className="break-all text-sm font-semibold text-text-primary">
            {email}
          </div>
        </div>

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