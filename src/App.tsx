import { useEffect, useState } from 'react'
import { useTheme } from './theme'
import MarketingPage from './pages/MarketingPage'
import AuthPage from './pages/AuthPage'
import AccessPendingPage from './pages/AccessPendingPage'
import InvitationPage from './pages/InvitationPage'
import DashboardApp from './DashboardApp'
import DevDashboardApp from './DevDashboardApp'
import * as api from './api'
import type { AuthSession, LoginPayload, SignupPayload } from './types'

type AppView = 'marketing' | 'auth' | 'dashboard' | 'pending' | 'invitation'
type AuthMode = 'login' | 'signup'

function getViewForSession(session: AuthSession): AppView {
  if (session.requiresFirstAccessValidation && session.user.role === 'developer') return 'pending'
  return 'dashboard'
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => api.auth.loadSession())
  const invitationToken = new URLSearchParams(window.location.search).get('token')
  const [view, setView] = useState<AppView>(() => {
    if (invitationToken) return 'invitation'
    if (!session) return 'marketing'
    return getViewForSession(session)
  })
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const { dark, toggle } = useTheme()

  function openAuth(mode: AuthMode) {
    setAuthMode(mode)
    setView('auth')
  }

  async function authenticate(mode: AuthMode, payload: LoginPayload | SignupPayload) {
    const nextSession = mode === 'login'
      ? await api.auth.login(payload as LoginPayload)
      : await api.auth.signup(payload as SignupPayload)
    const remember = mode === 'login' ? (payload as LoginPayload).remember : true
    api.auth.saveSession(nextSession, remember)
    setSession(nextSession)
    setView(getViewForSession(nextSession))
  }

  function logout() {
    api.auth.clearSession()
    setSession(null)
    setView('marketing')
  }

  function updateUser(user: AuthSession['user']) {
    if (!session) return
    const updatedSession = { ...session, user }
    api.auth.saveSession(updatedSession, true)
    setSession(updatedSession)
  }

  useEffect(() => {
    window.addEventListener('avantt:unauthorized', logout)
    return () => window.removeEventListener('avantt:unauthorized', logout)
  }, [])

  if (view === 'invitation' && invitationToken) {
    return (
      <InvitationPage
        token={invitationToken}
        onAccepted={(nextSession) => {
          api.auth.saveSession(nextSession, true)
          setSession(nextSession)
          window.history.replaceState({}, '', '/')
          setView(getViewForSession(nextSession))
        }}
      />
    )
  }

  if (view === 'pending' && session) {
    return (
      <AccessPendingPage
        user={session.user}
        dark={dark}
        onToggleTheme={toggle}
        onLinked={(nextSession) => {
          api.auth.saveSession(nextSession, true)
          setSession(nextSession)
          setView(getViewForSession(nextSession))
        }}
        onLogout={logout}
        onUserUpdate={updateUser}
      />
    )
  }

  if (view === 'dashboard') {
    return session?.user.role === 'developer'
      ? <DevDashboardApp user={session.user} onLogout={logout} onUserUpdate={updateUser} />
      : <DashboardApp user={session?.user} onLogout={logout} onUserUpdate={updateUser} />
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
