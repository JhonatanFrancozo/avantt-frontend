import { useEffect, useState } from 'react'
import { useTheme } from './theme'
import MarketingPage from './pages/MarketingPage'
import AuthPage from './pages/AuthPage'
import AccessPendingPage from './pages/AccessPendingPage'
import DashboardApp from './DashboardApp'
import DevDashboardApp from './DevDashboardApp'
import * as api from './api'
import type { AuthSession, LoginPayload, SignupPayload } from './types'

type AppView = 'marketing' | 'auth' | 'dashboard'
type AuthMode = 'login' | 'signup'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => api.auth.loadSession())
  const [view, setView] = useState<AppView>(() => session ? 'dashboard' : 'marketing')
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
    setView('dashboard')
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

  if (view === 'dashboard') {
    if (session?.user.role === 'developer' && !session.user.organizationId) {
      return (
        <AccessPendingPage
          user={session.user}
          dark={dark}
          onToggleTheme={toggle}
          onLogout={logout}
          onUserUpdate={updateUser}
          onLinked={(linkedSession) => {
            api.auth.saveSession(linkedSession, true)
            setSession(linkedSession)
          }}
        />
      )
    }
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
        setSession(null)
        setView('dashboard')
      }}
    />
  )
}
