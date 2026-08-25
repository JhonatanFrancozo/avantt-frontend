import { c } from '../core/theme'
import type { Project } from '../core/types'

interface Props {
  project: Project
  selected: boolean
  onToggle: (name: string) => void
}

export default function ProjectPickerRow({ project: p, selected, onToggle }: Props) {
  return (
    <div
      onClick={() => onToggle(p.name)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${selected ? p.color : c.border}`, backgroundColor: selected ? p.color + '10' : c.bg, cursor: 'pointer', transition: 'all 0.12s' }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>{p.team.length} membro{p.team.length !== 1 ? 's' : ''} · {p.progress}% concluído</div>
      </div>
      <div style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${p.progress}%`, backgroundColor: p.color }} />
      </div>
      <span style={{ fontSize: 13, color: selected ? p.color : c.border }}>{selected ? '✓' : '○'}</span>
    </div>
  )
}


