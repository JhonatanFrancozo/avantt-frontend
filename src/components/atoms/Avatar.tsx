export default function Avatar({ i, color, size = 32 }: { i: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color + '22', border: `1.5px solid ${color}55`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 600, flexShrink: 0 }}>
      {i}
    </div>
  )
}
