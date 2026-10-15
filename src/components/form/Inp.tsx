import { inputStyle } from './inputStyle'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  id?: string
  name?: string
  required?: boolean
  autoComplete?: string
}

export default function Inp({ value, onChange, placeholder, type = 'text', id, name, required, autoComplete }: Props) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      required={required}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-blue focus:ring-4 focus:ring-blue-light"
    />
  )
}
