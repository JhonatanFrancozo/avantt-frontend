import { c } from '../../theme'

interface Bar { label: string; value: number; color?: string }

interface Props {
  data: Bar[]
  color?: string
  max?: number
}

export default function BarChart({ data, color = c.blue, max }: Props) {
  const m = max ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 130, fontSize: 12, color: c.textSecondary, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          <div style={{ flex: 1, height: 20, backgroundColor: c.bg, borderRadius: 4, overflow: 'hidden', position: 'relative', transition: 'background-color 0.3s' }}>
            <div style={{ height: '100%', width: `${(d.value / m) * 100}%`, backgroundColor: d.color ?? color, borderRadius: 4, transition: 'width 0.5s', minWidth: d.value > 0 ? 4 : 0 }} />
          </div>
          <div style={{ width: 32, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.textPrimary, flexShrink: 0 }}>{d.value}</div>
        </div>
      ))}
    </div>
  )
}
