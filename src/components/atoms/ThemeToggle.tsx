import { c } from '../../theme'

export default function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.surface, color: c.textSecondary, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', display: 'inline-block', width: 32, height: 18, borderRadius: 9, backgroundColor: dark ? 'var(--color-blue)' : 'var(--color-border)', transition: 'background-color 0.25s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: dark ? 17 : 3, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7 }}>
          {dark ? '🌙' : '☀'}
        </span>
      </span>
      {dark ? 'Tema Escuro' : 'Tema Claro'}
    </button>
  )
}
