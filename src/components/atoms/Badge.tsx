
import { STATUS_META } from '../../theme'
import type { TaskStatus } from '../../types.ts'

interface Props {
  status: TaskStatus
}

export default function Badge({ status }: Props) {
  const s = STATUS_META[status]

  const fallback = {
    label: status,
    bg: '#E5E7EB',
    text: '#374151',
  }

  const style = s ?? fallback

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}
