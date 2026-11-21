import { api, shouldUseMock } from './client'
import type { AuthSession, LoginPayload, SignupPayload } from '../types'
import { normalizeText } from '../utils'

const SESSION_KEY = 'avantt.session'

function normalizeSession(session: AuthSession): AuthSession {
  const rawUser = session.user as unknown as Record<string, unknown>
  const role = normalizeText(rawUser.role ?? rawUser.cargo).toLowerCase()
  const organizationId = rawUser.organizationId ?? rawUser.organizacaoId
  const projects = Array.isArray(rawUser.projects) ? rawUser.projects : []
  const rawProjectIds = Array.isArray(rawUser.projectIds)
    ? rawUser.projectIds.map(String).filter(Boolean)
    : projects.length > 0 && projects.every((item) => /^\d+$/.test(String(item)))
      ? projects.map(String)
      : undefined
  const projectIds = rawProjectIds && rawProjectIds.length > 0 ? rawProjectIds : undefined
  return {
    ...session,
    email: normalizeText(session.email ?? rawUser.email),
    user: {
      ...session.user,
      id: String(rawUser.id ?? ''),
      name: normalizeText(rawUser.name ?? rawUser.nome),
      email: normalizeText(rawUser.email),
      role: role.includes('desenvol') || role.includes('developer') || role.includes('colaborador')
        ? 'developer'
        : 'manager',
      organizationId: organizationId === null || organizationId === undefined ? undefined : Number(organizationId),
      organizationName: normalizeText(rawUser.organizationName ?? rawUser.organizacaoName),
      projectIds,
      hasProjects: projects.length > 0,
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

export function createDemoSession(): AuthSession {
  const session = mockSession({
    email: 'demo@avantt.com',
    name: 'Gustavo Silva',
    role: 'manager',
  })
  return { ...session, token: `demo-${Date.now()}` }
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  if (shouldUseMock()) return mockSession(payload)
  const { data } = await api.post<AuthSession>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
  if (data.requiresFirstAccessValidation) {
    return {
      token: '',
      email: normalizeText(data.email ?? payload.email),
      requiresFirstAccessValidation: true,
      user: {
        id: '',
        name: payload.email.split('@')[0],
        email: normalizeText(data.email ?? payload.email),
        role: 'developer',
      },
    }
  }
  return normalizeSession(data)
}

export async function acceptInvitation(payload: { token: string; email?: string; name?: string; password: string }): Promise<AuthSession> {
  if (shouldUseMock()) throw new Error('Aceitação de convite exige o backend real.')
  try {
    const { data } = await api.post<AuthSession>('/auth/convite/aceitar', {
      email: payload.email,
      password: payload.password,
      codigo: payload.token,
    })
    const normalized = normalizeSession(data)
    return {
      ...normalized,
      requiresFirstAccessValidation: false,
    }
  } catch (error) {
    const apiError = error as { response?: { status?: number; data?: { message?: string } } }
    const message = apiError.response?.data?.message ?? ''
    if (apiError.response?.status === 400
      && message.toLocaleLowerCase('pt-BR').includes('já foi concluído')
      && payload.email) {
      return login({
        email: payload.email,
        password: payload.password,
        remember: true,
      })
    }
    throw error
  }
}

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  if (shouldUseMock()) return mockSession({
    ...payload,
    role: payload.accountType === 'organization' ? 'manager' : 'developer',
    linked: payload.accountType === 'organization',
  })
  const endpoint = payload.accountType === 'organization'
    ? '/auth/register-organizacao'
    : '/auth/register'
  const request = payload.accountType === 'organization'
    ? {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        organizationName: payload.organizationName,
        cnpj: payload.cnpj,
      }
    : {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: 'Colaborador',
      }
  const { data } = await api.post<AuthSession>(endpoint, request)
  if (payload.accountType === 'organization') {
    return login({
      email: payload.email,
      password: payload.password,
      remember: true,
    })
  }
  const createdUser = (data as unknown as { user?: Record<string, unknown>; usuario?: Record<string, unknown> }).user
    ?? (data as unknown as { usuario?: Record<string, unknown> }).usuario
  return {
    token: '',
    email: payload.email,
    requiresFirstAccessValidation: true,
    user: {
      id: String(createdUser?.id ?? ''),
      name: payload.name,
      email: payload.email,
      role: 'developer',
    },
  }
}

export async function linkOrganization(code: string): Promise<AuthSession> {
  if (shouldUseMock()) {
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
