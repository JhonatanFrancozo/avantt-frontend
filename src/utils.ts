import type { Task, Sprint } from './types'
import { c } from './theme'

export function fmtDateShort(d: string) {
  if (!d) return '—'
  return new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getLocalDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export const TODAY_STR = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
})

export function mkInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function nextTaskId(tasks: Task[]) {
  const nums = tasks.map((t) => parseInt(t.id.replace('T-', ''))).filter(Boolean)
  return `T-${Math.max(0, ...nums) + 1}`
}

export function nextSprintId(sprints: Sprint[]) {
  return Math.max(0, ...sprints.map((s) => s.id)) + 1
}

/** Returns the CSS variable color for a delay value */
export function delayColor(days: number): string {
  return days >= 7 ? c.red : days >= 3 ? c.amber : c.blue
}

/** Returns the raw hex color for a delay value (for border/badge bg where var() can't mix with alpha) */
export function delayHex(days: number): string {
  return days >= 7 ? '#D95050' : days >= 3 ? '#E07B2A' : '#4B7BF5'
}

/** Returns a CSS variable color for a workload percentage */
export function workloadColor(value: number): string {
  return value >= 85 ? c.red : value >= 70 ? c.amber : c.green
}

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
]

/** Retorna a mensagem de erro, ou null se o e-mail for válido */
export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase()

  if (!value) return 'Informe o e-mail.'

  const match = /^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/.exec(value)

  if (!match || !ALLOWED_EMAIL_DOMAINS.includes(match[1])) {
    return 'Use um e-mail válido do Gmail, Hotmail ou Outlook.'
  }

  return null
}

/** Retorna a mensagem de erro, ou null se a senha for válida */
export function validatePassword(password: string): string | null {
  if (!password) return 'Informe a senha.'

  if (password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.'
  }

  if (/^\d+$/.test(password)) {
    return 'A senha não pode conter apenas números.'
  }

  if (!/[A-Za-z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra.'
  }

  if (!/\d/.test(password)) {
    return 'A senha deve conter pelo menos um número.'
  }

  return null
}
