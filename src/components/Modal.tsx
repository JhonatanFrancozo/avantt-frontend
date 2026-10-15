import { useEffect, useRef, type ReactNode } from 'react'
import { c } from '../theme'

interface Props {
  title: string
  onClose: () => void
  onSubmit: () => void
  submitLabel?: string
  children: ReactNode
  wide?: boolean
}

export default function Modal({ title, onClose, onSubmit, submitLabel = 'Criar', children, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div ref={ref} onClick={(e) => { if (e.target === ref.current) onClose() }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: c.surface, borderRadius: 14, width: '100%', maxWidth: wide ? 760 : 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', border: `1px solid ${c.border}`, transition: 'background-color 0.3s' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.textPrimary }}>{title}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textMuted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>✕</button>
        </div>
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancelar</button>
          <button onClick={onSubmit} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', backgroundColor: c.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}
