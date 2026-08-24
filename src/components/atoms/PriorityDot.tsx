import { c, PRIORITY_META } from '../../theme'
import type { TaskPriority } from '../../types'

export default function PriorityDot({ priority }: { priority: TaskPriority }) {
  const p = PRIORITY_META[priority]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.textSecondary, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.dot, flexShrink: 0 }} />
      {p.label}
    </span>
  )
}
