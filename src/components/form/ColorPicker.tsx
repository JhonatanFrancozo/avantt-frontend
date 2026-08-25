import { c } from '../../core/theme'

interface Props {
  colors: string[]
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ colors, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {colors.map((col) => (
        <button
          key={col}
          onClick={() => onChange(col)}
          style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: col, border: value === col ? `3px solid ${c.textPrimary}` : '2px solid transparent', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
        />
      ))}
    </div>
  )
}



