import { useState, type FormEvent } from 'react'
import * as api from '../api'
import Brand from '../components/Brand'
import ProductIcon from '../components/ProductIcon'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'
import type { AuthSession, SessionUser } from '../types'
import { ProfileModal } from '../modals'

interface Props {
  user: SessionUser
  dark: boolean
  onToggleTheme: () => void
  onLinked: (session: AuthSession) => void
  onLogout: () => void
  onUserUpdate: (user: SessionUser) => void
}

export default function AccessPendingPage({ user, dark, onToggleTheme, onLinked, onLogout, onUserUpdate }: Props) {
  const [email, setEmail] = useState(user.email ?? '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || password.length < 8 || !/^[A-Za-z0-9]{6}$/.test(code.trim())) {
      setError('Informe seu e-mail, senha e o código de 6 caracteres.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      onLinked(await api.auth.acceptInvitation({
        token: code.trim(),
        email: email.trim().toLowerCase(),
        password,
      }))
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 sm:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <BtnPrimary variant="ghost" onClick={onToggleTheme} ariaLabel={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            <ProductIcon name={dark ? 'sun' : 'moon'} />
          </BtnPrimary>
          <BtnPrimary variant="secondary" onClick={() => setProfileOpen(true)}>Meu perfil</BtnPrimary>
          <BtnPrimary variant="secondary" onClick={onLogout}>Sair</BtnPrimary>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section>
          <div className="mb-6 inline-flex rounded-full border border-blue/20 bg-blue-light px-3 py-1.5 text-xs font-semibold text-blue">
            Conta criada com sucesso
          </div>
          <div className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-text-primary">
            Olá, {user.name.split(' ')[0]}. Sua conta está pronta.
          </div>
          <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
            Você ainda não concluiu o acesso ao projeto. Enquanto a validação não for concluída, nenhum projeto ou tarefa ficará disponível.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Peça um convite', 'Solicite o código ao gestor da empresa.'],
              ['2', 'Vincule sua conta', 'Use o código no formulário ao lado.'],
              ['3', 'Acesse o trabalho', 'Os dados liberados aparecerão automaticamente.'],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-xl border border-border bg-surface p-4">
                <div className="grid size-7 place-items-center rounded-lg bg-blue-light text-xs font-bold text-blue">{number}</div>
                <div className="mt-3 text-sm font-semibold text-text-primary">{title}</div>
                <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-sidebar/5 sm:p-8">
          <div className="text-xl font-bold text-text-primary">Validar primeiro acesso</div>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Use o código enviado por e-mail junto com suas credenciais.
          </p>

          <form className="mt-7 space-y-5" onSubmit={submit}>
            <Field label="E-mail" required>
              <Inp
                id="pending-email"
                name="email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Senha" required>
              <Inp
                id="pending-password"
                name="password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Sua senha cadastrada"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="Código de 6 dígitos" required error={error}>
              <Inp
                id="access-code"
                name="accessCode"
                value={code}
                onChange={setCode}
                placeholder="Ex: 123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </Field>
            <BtnPrimary type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Validando código...' : 'Concluir primeiro acesso'}
              <ProductIcon name="arrow" />
            </BtnPrimary>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-bg p-4 text-xs leading-5 text-text-muted">
            O código é fornecido por um gestor e identifica a organização à qual sua conta terá acesso.
          </div>
        </section>
      </main>
      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSaved={onUserUpdate} />}
    </div>
  )
}
