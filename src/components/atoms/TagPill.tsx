import { c } from '../../theme'

interface Props {
  tag: string
  onRemove?: () => void
}

export default function TagPill({ tag, onRemove }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: c.blueLight, color: c.blue, fontWeight: 500 }}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.blue, fontSize: 11, padding: 0 }}>✕</button>
      )}
    </span>
  )
}
