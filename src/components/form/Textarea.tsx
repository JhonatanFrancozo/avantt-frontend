import { inputStyle } from './inputStyle'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

export default function Textarea({ value, onChange, placeholder, rows = 3 }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
    />
  )
}



