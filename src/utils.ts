import type { Task, Sprint, TaskStatus } from './types'
import { c } from './theme'

export function getTaskStatusActions(status: TaskStatus): { status: TaskStatus; label: string }[] {
  if (status === 'Planejada') {
    return [
      { status: 'Em andamento', label: 'Iniciar tarefa' },
    ]
  }
  if (status === 'Em andamento') {
    return [
      { status: 'Bloqueada', label: 'Bloquear tarefa' },
      { status: 'Concluída', label: 'Finalizar tarefa' },
    ]
  }
  if (status === 'Bloqueada') {
    return [{ status: 'Em andamento', label: 'Retomar tarefa' }]
  }
  return []
}

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

export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  const replacements: Record<string, string> = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ã§': 'ç', 'Ã‡': 'Ç',
    'Ã±': 'ñ', 'Ã‘': 'Ñ',
    'Âª': 'ª', 'Âº': 'º',
  }
  for (const [broken, fixed] of Object.entries(replacements)) {
    text = text.split(broken).join(fixed)
  }
  return text
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

export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function dateInputToIso(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return ''
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function isoToDateInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
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
