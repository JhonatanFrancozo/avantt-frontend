import type { ReactNode } from 'react'
import { c } from '../../core/theme'

interface Props {
  label: string
  value: ReactNode
  sub: string
  color: string
  icon?: string
}

export default function StatCard({ label, value, sub, color, icon }: Props) {
  return (
    <div style={{ flex: 1, backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'background-color 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: c.textSecondary }}>{label}</span>
        {icon && <span style={{ fontSize: 13, color }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: 11, color: c.textMuted }}>{sub}</div>
    </div>
  )
}



