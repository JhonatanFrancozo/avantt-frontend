import type { ReactNode } from 'react'
import { c } from '../../theme'

interface Props {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

export default function Field({ label, required, error, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>
        {label}
        {required && <span style={{ color: c.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: c.red }}>{error}</span>}
    </div>
  )
}
