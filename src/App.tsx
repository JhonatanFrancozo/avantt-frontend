
import { useEffect, useState, type FormEvent } from 'react'
import { useTheme } from './theme'
import MarketingPage from './pages/MarketingPage'
import AuthPage from './pages/AuthPage'
import InvitationPage from './pages/InvitationPage'
import DashboardApp from './DashboardApp'
import DevDashboardApp from './DevDashboardApp'
import * as api from './api'
import { confirmPasswordReset } from './api/auth'
import type {
  AuthSession,
  LoginPayload,
  SignupPayload,
  SessionUser,
} from './types'
import { TesteStatus } from './components/TesteStatus'

type AppView =
  | 'marketing'
  | 'auth'
  | 'dashboard'
  | 'invitation'
  | 'status'
  | 'reset-password'

type AuthMode = 'login' | 'signup'

interface PendingFirstAccess {
  email: string
  password: string
  remember: boolean
}

function ResetPasswordPage({
  token,
  onSuccess,
}: {
  token: string
  onSuccess: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas informadas não são iguais.')
      return
    }

    setSubmitting(true)

    try {
      const updated = await confirmPasswordReset(token, password)

      if (!updated) {
        setError('Não foi possível redefinir a senha. Solicite um novo link.')
        return
      }

      setSuccess(true)
    } catch {
      setError(
        'Não foi possível redefinir a senha. O link pode ter expirado ou já ter sido utilizado.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Criar nova senha
        </h1>

        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Informe sua nova senha para recuperar o acesso à sua conta Avantt.
        </p>

        {success ? (
          <div className="mt-6 space-y-5">
            <div
              role="status"
              className="rounded-lg border border-green/20 bg-green-light px-4 py-3 text-sm leading-6 text-text-primary"
            >
              Sua senha foi alterada com sucesso. Agora você já pode entrar
              utilizando a nova senha.
            </div>

            <button
              type="button"
              onClick={onSuccess}
              className="w-full rounded-lg bg-blue px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Nova senha
              </label>

              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-text-primary outline-none focus:border-blue"
                placeholder="Digite sua nova senha"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Confirmar nova senha
              </label>

              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-text-primary outline-none focus:border-blue"
                placeholder="Digite novamente sua nova senha"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red/20 bg-red-light px-3.5 py-3 text-sm text-red"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(
    () => api.auth.loadSession()
  )

  const [resetToken, setResetToken] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('resetToken')
  )

  const testarStatus =
    new URLSearchParams(window.location.search).get('teste') === 'status'

  const [view, setView] = useState<AppView>(() => {
    const token = new URLSearchParams(window.location.search).get('resetToken')

    if (testarStatus) return 'status'
    if (token) return 'reset-password'

    return api.auth.loadSession() ? 'dashboard' : 'marketing'
  })

  const [authMode, setAuthMode] = useState<AuthMode>('login')

  const [pendingFirstAccess, setPendingFirstAccess] =
    useState<PendingFirstAccess | null>(null)

  const { dark, toggle } = useTheme()

  function openAuth(mode: AuthMode) {
    setAuthMode(mode)
    setView('auth')
  }

  async function authenticate(
    mode: AuthMode,
    payload: LoginPayload | SignupPayload
  ) {
    if (mode === 'login') {
      const loginPayload = payload as LoginPayload
      const result = await api.auth.login(loginPayload)

      if (result.requiresFirstAccessValidation) {
        setPendingFirstAccess({
          email: result.email,
          password: loginPayload.password,
          remember: loginPayload.remember,
        })

        setView('invitation')
        return
      }

      api.auth.saveSession(result.session, loginPayload.remember)
      setSession(result.session)
      setPendingFirstAccess(null)
      setView('dashboard')
      return
    }

    const nextSession = await api.auth.signup(payload as SignupPayload)

    api.auth.saveSession(nextSession, true)
    setSession(nextSession)
    setPendingFirstAccess(null)
    setView('dashboard')
  }

  function finishFirstAccess(nextSession: AuthSession) {
    if (!pendingFirstAccess) return

    api.auth.saveSession(
      nextSession,
      pendingFirstAccess.remember
    )

    setSession(nextSession)
    setPendingFirstAccess(null)
    setView('dashboard')
  }

  function cancelFirstAccess() {
    setPendingFirstAccess(null)
    setAuthMode('login')
    setView('auth')
  }

  function logout() {
    api.auth.clearSession()
    setSession(null)
    setPendingFirstAccess(null)
    setView('marketing')
  }

  function updateUser(user: SessionUser) {
    if (!session) return

    const updatedSession = {
      ...session,
      user,
    }

    api.auth.saveSession(updatedSession, true)
    setSession(updatedSession)
  }

  function finishPasswordReset() {
    window.history.replaceState({}, document.title, window.location.pathname)

    setResetToken(null)
    setAuthMode('login')
    setView('auth')
  }

  useEffect(() => {
    window.addEventListener('avantt:unauthorized', logout)

    return () => {
      window.removeEventListener('avantt:unauthorized', logout)
    }
  }, [])

  if (view === 'status') {
    return <TesteStatus />
  }

  if (view === 'reset-password' && resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onSuccess={finishPasswordReset}
      />
    )
  }

  if (view === 'invitation' && pendingFirstAccess) {
    return (
      <InvitationPage
        email={pendingFirstAccess.email}
        password={pendingFirstAccess.password}
        onAccepted={finishFirstAccess}
        onCancel={cancelFirstAccess}
      />
    )
  }

  if (view === 'dashboard') {
    return session?.user.role === 'developer' ? (
      <DevDashboardApp
        user={session.user}
        onLogout={logout}
        onUserUpdate={updateUser}
      />
    ) : (
      <DashboardApp
        user={session?.user}
        onLogout={logout}
        onUserUpdate={updateUser}
      />
    )
  }

  if (view === 'auth') {
    return (
      <AuthPage
        initialMode={authMode}
        dark={dark}
        onToggleTheme={toggle}
        onBack={() => setView('marketing')}
        onSubmit={authenticate}
      />
    )
  }

  return (
    <MarketingPage
      dark={dark}
      onToggleTheme={toggle}
      onLogin={() => openAuth('login')}
      onSignup={() => openAuth('signup')}
      onDemo={() => {
        setSession(null)
        setView('dashboard')
      }}
    />
  )
}
