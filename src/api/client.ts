import axios from 'axios'

/**
 * Flip para false (ou defina VITE_USE_MOCK=false no .env) para usar a API real.
 * Quando true, todas as chamadas usam os handlers mock em ./mock/db.ts.
 */
export const IS_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API]', err?.response?.status, err?.config?.url)
    return Promise.reject(err)
  },
)



