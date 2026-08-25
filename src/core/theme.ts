import { useState, useEffect } from 'react'
import type { TaskStatus, TaskPriority } from './types'

export function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark((d) => !d) }
}

export const c = {
  bg: 'var(--color-bg)', surface: 'var(--color-surface)',
  sidebar: 'var(--color-sidebar)', sidebarActive: 'var(--color-sidebar-active)',
  textPrimary: 'var(--color-text-primary)', textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)', textOnDark: 'var(--color-text-on-dark)',
  textOnDarkMuted: 'var(--color-text-on-dark-muted)', border: 'var(--color-border)',
  blue: 'var(--color-blue)', blueLight: 'var(--color-blue-light)',
  amber: 'var(--color-amber)', amberLight: 'var(--color-amber-light)',
  red: 'var(--color-red)', redLight: 'var(--color-red-light)',
  green: 'var(--color-green)', greenLight: 'var(--color-green-light)',
  purple: 'var(--color-purple)', purpleLight: 'var(--color-purple-light)',
}

export const STATUS_META: Record<TaskStatus, { bg: string; text: string; label: string; dot: string }> = {
  planejada:      { bg: 'var(--color-border)', text: 'var(--color-text-secondary)', label: 'Planejada', dot: 'var(--color-text-muted)' },
  'em andamento': { bg: 'var(--color-blue-light)', text: 'var(--color-blue)', label: 'Em Andamento', dot: 'var(--color-blue)' },
  revisão:        { bg: 'var(--color-purple-light)', text: 'var(--color-purple)', label: 'Revisão', dot: 'var(--color-purple)' },
  bloqueada:      { bg: 'var(--color-red-light)', text: 'var(--color-red)', label: 'Bloqueada', dot: 'var(--color-red)' },
  concluída:      { bg: 'var(--color-green-light)', text: 'var(--color-green)', label: 'Concluída', dot: 'var(--color-green)' },
  cancelada:      { bg: 'var(--color-border)', text: 'var(--color-text-muted)', label: 'Cancelada', dot: 'var(--color-text-muted)' },
}

export const STATUS_OPTIONS: TaskStatus[] = ['planejada', 'em andamento', 'revisão', 'bloqueada', 'concluída', 'cancelada']

export const PRIORITY_META: Record<TaskPriority, { dot: string; label: string }> = {
  crítica: { dot: 'var(--color-red)', label: 'Crítica' },
  alta:    { dot: 'var(--color-amber)', label: 'Alta' },
  média:   { dot: 'var(--color-blue)', label: 'Média' },
  baixa:   { dot: 'var(--color-green)', label: 'Baixa' },
}


