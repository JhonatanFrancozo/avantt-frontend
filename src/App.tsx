import { useEffect, useState } from 'react'
import { useTheme } from './theme'
import MarketingPage from './pages/MarketingPage'
import AuthPage from './pages/AuthPage'
import InvitationPage from './pages/InvitationPage'
import DashboardApp from './DashboardApp'
import DevDashboardApp from './DevDashboardApp'
import * as api from './api'
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

type AuthMode = 'login' | 'signup'

interface PendingFirstAccess {
  email: string
  password: string
  remember: boolean
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(
    () => api.auth.loadSession()
  )

  const testarStatus =
    new URLSearchParams(window.location.search).get('teste') === 'status'

  const [view, setView] = useState<AppView>(() =>
    testarStatus
      ? 'status'
      : api.auth.loadSession()
        ? 'dashboard'
        : 'marketing'
  )

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

  useEffect(() => {
    window.addEventListener('avantt:unauthorized', logout)

    return () => {
      window.removeEventListener('avantt:unauthorized', logout)
    }
  }, [])

  if (view === 'status') {
    return <TesteStatus />
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