import { inputStyle } from './inputStyle'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

export default function Inp({ value, onChange, placeholder, type = 'text' }: Props) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  )
}



