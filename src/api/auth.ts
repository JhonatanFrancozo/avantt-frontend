import { api, IS_MOCK } from './client'
import type { AuthSession, LoginPayload, SignupPayload } from '../types'

const SESSION_KEY = 'avantt.session'

function normalizeSession(session: AuthSession): AuthSession {
  const role = String(session.user.role).toLowerCase()
  return {
    ...session,
    user: {
      ...session.user,
      role: role.includes('desenvol') || role.includes('developer') || role.includes('colaborador')
        ? 'developer'
        : 'manager',
    },
  }
}

function mockSession(payload: { email: string; name?: string; role?: 'manager' | 'developer'; linked?: boolean }): AuthSession {
  const isDeveloper = payload.role === 'developer' || payload.email.toLowerCase().includes('dev')
  const isScopedManager = !isDeveloper && payload.email.toLowerCase().includes('cliente')
  const hasOrganization = !isDeveloper || payload.linked !== false
  return {
    token: `mock-${Date.now()}`,
    user: {
      id: isDeveloper ? 'm4' : 'manager-1',
      name: payload.name ?? (isDeveloper ? 'Ana Lima' : 'Gustavo Silva'),
      email: payload.email,
      role: isDeveloper ? 'developer' : 'manager',
      avatar: isDeveloper ? 'AL' : 'GS',
      color: '#4B7BF5',
      organizationId: hasOrganization ? 1 : undefined,
      organizationName: hasOrganization ? 'AVANTT Tecnologia' : undefined,
      projectIds: isScopedManager ? ['p1'] : undefined,
    },
  }
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  if (IS_MOCK) return mockSession(payload)
  const { data } = await api.post<AuthSession>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
  return normalizeSession(data)
}

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  if (IS_MOCK) return mockSession({
    ...payload,
    role: payload.accountType === 'organization' ? 'manager' : 'developer',
    linked: payload.accountType === 'organization',
  })
  const { data } = await api.post<AuthSession>('/auth/register', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.accountType === 'organization' ? 'Admin' : 'Colaborador',
  })
  return normalizeSession(data)
}

export async function linkOrganization(code: string): Promise<AuthSession> {
  if (IS_MOCK) {
    const current = loadSession()
    if (!current) throw new Error('Sessão não encontrada. Entre novamente.')
    if (code.trim().length < 4) throw new Error('Código de acesso inválido.')
    return {
      ...current,
      token: `mock-linked-${Date.now()}`,
      user: {
        ...current.user,
        organizationId: 1,
        organizationName: 'AVANTT Tecnologia',
      },
    }
  }
  const { data } = await api.post<AuthSession>('/auth/vincular-organizacao', { codigo: code })
  return normalizeSession(data)
}

export function saveSession(session: AuthSession, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage
  otherStorage.removeItem(SESSION_KEY)
  storage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) as AuthSession : null
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
