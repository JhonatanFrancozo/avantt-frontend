import axios from 'axios'

/**
 * A API real é o padrão. Ative os mocks com VITE_USE_MOCK=true ou na demonstração.
 */
export const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function isDemoMode() {
  try {
    const raw = localStorage.getItem('avantt.session') ?? sessionStorage.getItem('avantt.session')
    return Boolean(raw && JSON.parse(raw).token?.startsWith('demo-'))
  } catch {
    return false
  }
}

export function shouldUseMock() {
  return IS_MOCK || isDemoMode()
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

const SESSION_KEY = 'avantt.session'

export function getStoredToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
    const token = raw ? JSON.parse(raw).token : null
    return typeof token === 'string' && token.trim() ? token : null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API]', err?.response?.status, err?.config?.url)
    const url = String(err?.config?.url ?? '')
    const isAuthRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/register-organizacao',
      '/auth/convite/aceitar',
      '/auth/password-reset/request',
      '/auth/password-reset/confirm',
    ].some((path) => url.includes(path))

    if (err?.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      window.dispatchEvent(new Event('avantt:unauthorized'))
    }
    return Promise.reject(err)
  },
)

type ApiErrorPayload = {
  message?: string
  error?: string
  details?: unknown
}

type ApiErrorDetail = {
  field?: string
  message: string
}

export function getApiErrorDetails(error: unknown): ApiErrorDetail[] {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return []

  const details = error.response?.data?.details
  if (!Array.isArray(details)) return []

  return details.filter((detail): detail is ApiErrorDetail => {
    if (
      typeof detail !== 'object' ||
      detail === null ||
      !('message' in detail) ||
      typeof detail.message !== 'string'
    ) {
      return false
    }

    return !('field' in detail) || typeof detail.field === 'string'
  })
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message
  if (!axios.isAxiosError<ApiErrorPayload>(error) || !error.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
  }

  const detailsMessage = getApiErrorDetails(error)
    .map((detail) => detail.message)
    .join(' ')
  if (detailsMessage) return detailsMessage

  return error.response.data?.message
    ?? error.response.data?.error
    ?? 'Não foi possível concluir a solicitação.'
}
