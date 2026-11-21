import { api, IS_MOCK } from './client'
import type {
  AuthSession,
  LoginPayload,
  LoginResult,
  SignupPayload,
} from '../types'

const SESSION_KEY = 'avantt.session'

interface LoginResponse {
  token?: string | null
  user?: AuthSession['user'] | null
  requiresFirstAccessValidation?: boolean
  email?: string | null
}

function normalizeSession(session: AuthSession): AuthSession {
  const rawUser = session.user as AuthSession['user'] & {
    organizacaoId?: number | string | null
  }

  const role = String(rawUser.role).toLowerCase()
  const papel = String(
    (rawUser as AuthSession['user'] & { papel?: string }).papel ??
    ''
  ).toLowerCase()
  const cargo = String(
    (rawUser as AuthSession['user'] & { cargo?: string }).cargo ??
    ''
  ).toLowerCase()

  const organizationIdRaw =
    rawUser.organizationId ?? rawUser.organizacaoId

  const organizationId =
    organizationIdRaw != null && organizationIdRaw !== ''
      ? Number(organizationIdRaw)
      : undefined

  return {
    ...session,
    user: {
      ...rawUser,
      organizationId:
        organizationId !== undefined && Number.isFinite(organizationId)
          ? organizationId
          : undefined,
      role:
        papel.includes('developer') ||
        papel.includes('desenvolv') ||
        cargo.includes('desenvolv') ||
        cargo.includes('developer') ||
        cargo.includes('colaborador') ||
        role.includes('desenvolv') ||
        role.includes('developer') ||
        role.includes('colaborador')
          ? 'developer'
          : 'manager',
    },
  }
}

function mockSession(payload: {
  email: string
  name?: string
  role?: 'manager' | 'developer'
  linked?: boolean
}): AuthSession {
  const isDeveloper =
    payload.role === 'developer' ||
    payload.email.toLowerCase().includes('dev')

  const isScopedManager =
    !isDeveloper &&
    payload.email.toLowerCase().includes('cliente')

  const hasOrganization =
    !isDeveloper || payload.linked !== false

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

export async function login(
  payload: LoginPayload
): Promise<LoginResult> {
  if (IS_MOCK) {
    return {
      requiresFirstAccessValidation: false,
      session: mockSession(payload),
    }
  }

  const { data } = await api.post<LoginResponse>(
    '/auth/login',
    {
      email: payload.email,
      password: payload.password,
    }
  )

  if (data.requiresFirstAccessValidation === true) {
    return {
      requiresFirstAccessValidation: true,
      email: data.email ?? payload.email,
    }
  }

  if (!data.token || !data.user) {
    throw new Error('O servidor retornou uma sessão de login inválida.')
  }

  const session = normalizeSession({
    token: data.token,
    user: data.user,
  })

  return {
    requiresFirstAccessValidation: false,
    session,
  }
}

export async function acceptInvitation(payload: {
  email: string
  password: string
  codigo: string
}): Promise<AuthSession> {
  if (IS_MOCK) {
    throw new Error(
      'A validação do primeiro acesso exige o backend real.'
    )
  }

  const { data } = await api.post<AuthSession>(
    '/auth/convite/aceitar',
    {
      email: payload.email,
      password: payload.password,
      codigo: payload.codigo,
    }
  )

  return normalizeSession(data)
}

export async function signup(
  payload: SignupPayload
): Promise<LoginResult> {
  if (IS_MOCK) {
    return {
      requiresFirstAccessValidation: false,
      session: mockSession({
        ...payload,
        role: payload.accountType === 'organization' ? 'manager' : 'developer',
        linked: payload.accountType === 'organization',
      }),
    }
  }

  const endpoint =
    payload.accountType === 'organization'
      ? '/auth/register-organizacao'
      : '/auth/register'

  const request =
    payload.accountType === 'organization'
      ? {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          organizationName: payload.organizationName,
          cnpj: payload.cnpj,
          contact: payload.name,
          emailContato: payload.email,
          phone: payload.phone,
        }
      : {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: 'Colaborador',
        }

  await api.post(endpoint, request)

  return login({
    email: payload.email,
    password: payload.password,
    remember: true,
  })
}

export async function linkOrganization(
  code: string
): Promise<AuthSession> {
  if (IS_MOCK) {
    const current = loadSession()

    if (!current) {
      throw new Error('Sessão não encontrada. Entre novamente.')
    }

    if (code.trim().length < 4) {
      throw new Error('Código de acesso inválido.')
    }

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

  const { data } = await api.post<AuthSession>(
    '/auth/vincular-organizacao',
    { codigo: code }
  )

  return normalizeSession(data)
}

export function saveSession(
  session: AuthSession,
  remember: boolean
) {
  const normalizedSession = normalizeSession(session)

  const storage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage

  otherStorage.removeItem(SESSION_KEY)

  storage.setItem(
    SESSION_KEY,
    JSON.stringify(normalizedSession)
  )
}

export function loadSession(): AuthSession | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ??
      sessionStorage.getItem(SESSION_KEY)

    if (!raw) return null

    const session = normalizeSession(JSON.parse(raw) as AuthSession)
    if (!IS_MOCK && session.token.startsWith('mock-')) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}