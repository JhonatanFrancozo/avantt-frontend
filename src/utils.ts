import type { Task, Sprint } from './types'
import { c } from './theme'

export function fmtDateShort(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
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
