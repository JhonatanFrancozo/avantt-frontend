import { inputStyle } from './inputStyle'

interface Props {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export default function Sel({ value, onChange, options }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
      <option value="">Selecione…</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}



