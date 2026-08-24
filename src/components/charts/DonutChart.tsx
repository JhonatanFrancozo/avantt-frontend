interface Slice { value: number; color: string; label: string }

export default function DonutChart({ slices, size = 120 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1
  let offset = -90
  const r = 40, cx = 60, cy = 60, stroke = 14

  const arcs = slices.map((s) => {
    const deg = (s.value / total) * 360
    const rad = (a: number) => (a * Math.PI) / 180
    const x1 = cx + r * Math.cos(rad(offset))
    const y1 = cy + r * Math.sin(rad(offset))
    offset += deg
    const x2 = cx + r * Math.cos(rad(offset))
    const y2 = cy + r * Math.sin(rad(offset))
    return { ...s, x1, y1, x2, y2, deg, large: deg > 180 ? 1 : 0 }
  })

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      {arcs.filter((a) => a.deg > 0.5).map((a, i) => (
        <path key={i} d={`M ${a.x1} ${a.y1} A ${r} ${r} 0 ${a.large} 1 ${a.x2} ${a.y2}`} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="round" />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)" fontFamily="var(--font-mono)">{total}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)" fontFamily="var(--font-sans)">tarefas</text>
    </svg>
  )
}
