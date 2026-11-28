import { api, IS_MOCK } from './client'
import type {
  AuthSession,
  LoginPayload,
  LoginResult,
  SignupPayload,
} from '../types'

const SESSION_KEY = 'avantt.session'

function normalizeSession(session: AuthSession): AuthSession {
  const rawUser = session.user as AuthSession['user'] & {
    organizacaoId?: number | string | null
  }

  const role = String(rawUser.role).toLowerCase()

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

export async function login(
  payload: LoginPayload
): Promise<LoginResult> {
  if (IS_MOCK) {
    return {
      requiresFirstAccessValidation: false,
      session: mockSession(payload),
    }
  }

  const { data } = await api.post<LoginResult | AuthSession>(
    '/auth/login',
    {
      email: payload.email,
      password: payload.password,
    }
  )

  const response = data as LoginResult & Partial<AuthSession>

  if (response.requiresFirstAccessValidation === true) {
    return {
      requiresFirstAccessValidation: true,
      email: response.email ?? payload.email,
    }
  }

  const session = normalizeSession({
    token: response.token as string,
    user: response.user as AuthSession['user'],
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
        }
      : {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: 'Colaborador',
        }

  const { data } = await api.post<AuthSession>(endpoint, request)

  if (payload.accountType === 'developer') {
    return {
      requiresFirstAccessValidation: true,
      email: payload.email,
    }
  }

  return {
    requiresFirstAccessValidation: false,
    session: normalizeSession(data),
  }
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

/**
 * Solicita o envio do e-mail para recuperação de senha.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (IS_MOCK) {
    throw new Error(
      'A recuperação de senha exige a conexão com o backend. Desative o modo mock para continuar.'
    )
  }

  await api.post('/auth/password-reset/request', {
    email: email.trim().toLowerCase(),
  })
}

/**
 * Confirma a redefinição da senha usando o token recebido por e-mail.
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<boolean> {
  if (IS_MOCK) {
    throw new Error(
      'A recuperação de senha exige a conexão com o backend. Desative o modo mock para continuar.'
    )
  }

  const { data } = await api.post<boolean>(
    '/auth/password-reset/confirm',
    {
      token: token.trim(),
      newPassword,
    }
  )

  // O backend atualizado retorna true.
  // O retorno vazio também é aceito para compatibilidade com a versão anterior.
  return data === true || data === undefined || data === null
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

    return raw
      ? normalizeSession(JSON.parse(raw) as AuthSession)
      : null
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}