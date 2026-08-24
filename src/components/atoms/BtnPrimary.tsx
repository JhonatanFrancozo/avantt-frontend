import type { ReactNode } from 'react'
import { c } from '../../theme'

export default function BtnPrimary({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: c.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}
