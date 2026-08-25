import { c } from '../../core/theme'
import { workloadColor } from '../../core/utils'

interface Props {
  value: number
  /** Explicit bar color; if omitted, uses workload-based traffic-light colors */
  color?: string
  height?: number
}

export default function ProgressBar({ value, color, height = 4 }: Props) {
  const barColor = color ?? workloadColor(value)
  return (
    <div style={{ width: '100%', height, backgroundColor: c.border, borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, backgroundColor: barColor, borderRadius: height / 2, transition: 'width 0.4s' }} />
    </div>
  )
}



