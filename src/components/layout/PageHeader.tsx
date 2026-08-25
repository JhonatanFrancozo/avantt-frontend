import type { ReactNode } from 'react'
import { c } from '../../core/theme'
import Avatar from '../atoms/Avatar'
import ThemeToggle from '../atoms/ThemeToggle'

interface Props {
  title: string
  subtitle?: string
  dark: boolean
  onToggle: () => void
  children?: ReactNode
}

export default function PageHeader({ title, subtitle, dark, onToggle, children }: Props) {
  return (
    <header style={{ backgroundColor: c.surface, borderBottom: `1px solid ${c.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, transition: 'background-color 0.3s' }}>
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: c.textMuted, margin: 0, marginTop: 2, textTransform: 'capitalize' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {children}
        <ThemeToggle dark={dark} onToggle={onToggle} />
        <div style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}>
          🔔
          <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', backgroundColor: c.red, border: `1.5px solid ${c.surface}` }} />
        </div>
        <Avatar i="GS" color="#4B7BF5" size={34} />
      </div>
    </header>
  )
}



