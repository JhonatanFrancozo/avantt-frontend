import { STATUS_META } from '../../core/theme'
import type { TaskStatus } from '../../core/types'

export default function Badge({ status }: { status: TaskStatus }) {
  const s = STATUS_META[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.text, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}



