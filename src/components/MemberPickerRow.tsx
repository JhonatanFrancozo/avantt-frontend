import { c } from '../core/theme'
import { workloadColor } from '../core/utils'
import Avatar from './atoms/Avatar'
import type { Member } from '../core/types'

interface Props {
  member: Member
  selected: boolean
  onToggle: (name: string) => void
  showWorkload?: boolean
}

export default function MemberPickerRow({ member: m, selected, onToggle, showWorkload = true }: Props) {
  return (
    <div
      onClick={() => onToggle(m.name)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${selected ? m.color : c.border}`, backgroundColor: selected ? m.color + '12' : c.bg, cursor: 'pointer', transition: 'all 0.12s' }}
    >
      <Avatar i={m.avatar} color={m.color} size={26} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: c.textPrimary }}>{m.name}</div>
        <div style={{ fontSize: 10, color: c.textMuted }}>{m.role}</div>
      </div>
      {showWorkload && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${m.workload}%`, backgroundColor: workloadColor(m.workload) }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: m.workload >= 85 ? c.red : c.textMuted }}>{m.workload}%</span>
        </div>
      )}
      <span style={{ fontSize: 13, color: selected ? m.color : c.border }}>{selected ? '✓' : '○'}</span>
    </div>
  )
}


