import type { ReactNode } from 'react'
import { c } from '../../theme'
import Avatar from '../atoms/Avatar'
import ThemeToggle from '../atoms/ThemeToggle'
import BtnPrimary from '../atoms/BtnPrimary'
import type { SessionUser } from '../../types'

interface Props {
  title: string
  subtitle?: string
  dark: boolean
  onToggle: () => void
  children?: ReactNode
  user?: SessionUser
  onProfile?: () => void
}

export default function PageHeader({ title, subtitle, dark, onToggle, children, user, onProfile }: Props) {
  return (
    <header style={{ backgroundColor: c.surface, borderBottom: `1px solid ${c.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, transition: 'background-color 0.3s' }}>
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: c.textMuted, margin: 0, marginTop: 2, textTransform: 'capitalize' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {children}
        <ThemeToggle dark={dark} onToggle={onToggle} />
        {onProfile ? (
          <BtnPrimary
            variant="ghost"
            compact
            onClick={onProfile}
            ariaLabel="Abrir meu perfil"
          >
            <Avatar i={user?.avatar ?? 'GS'} color={user?.color ?? '#4B7BF5'} size={34} />
          </BtnPrimary>
        ) : (
          <Avatar i={user?.avatar ?? 'GS'} color={user?.color ?? '#4B7BF5'} size={34} />
        )}
      </div>
    </header>
  )
}
