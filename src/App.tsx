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
  LoginResult,
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
  const conviteDireto =
    new URLSearchParams(window.location.search).get('convite') === '1'
  const conviteEmail =
    new URLSearchParams(window.location.search).get('email') ?? ''

  const [view, setView] = useState<AppView>(() =>
    testarStatus
      ? 'status'
      : conviteDireto
        ? 'invitation'
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

      completeAuthentication(
        result,
        loginPayload.email,
        loginPayload.password,
        loginPayload.remember
      )
      return
    }

    const signupPayload = payload as SignupPayload
    const result = await api.auth.signup(signupPayload)

    completeAuthentication(
      result,
      signupPayload.email,
      signupPayload.password,
      true
    )
  }

  function completeAuthentication(
    result: LoginResult,
    email: string,
    password: string,
    remember: boolean
  ) {
    if (result.requiresFirstAccessValidation) {
      setPendingFirstAccess({
        email: result.email || email,
        password,
        remember,
      })

      setView('invitation')
      return
    }

    api.auth.saveSession(result.session, remember)
    setSession(result.session)
    setPendingFirstAccess(null)
    setView('dashboard')
  }

  function finishFirstAccess(nextSession: AuthSession) {
    api.auth.saveSession(nextSession, pendingFirstAccess?.remember ?? true)

    setSession(nextSession)
    setPendingFirstAccess(null)
    window.history.replaceState({}, '', window.location.pathname)
    setView('dashboard')
  }

  function cancelFirstAccess() {
    setPendingFirstAccess(null)
    setAuthMode('login')
    window.history.replaceState({}, '', window.location.pathname)
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

  if (view === 'invitation') {
    return (
      <InvitationPage
        email={conviteEmail}
        onAccepted={finishFirstAccess}
        onCancel={cancelFirstAccess}
        allowPasswordSetup
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
        const demoSession = api.auth.createDemoSession()
        api.auth.saveSession(demoSession, false)
        setSession(demoSession)
        setView('dashboard')
      }}
    />
  )
}