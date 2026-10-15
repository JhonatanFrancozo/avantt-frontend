interface Props { name: string; size?: number }

export default function NavIcon({ name, size = 16 }: Props) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 }
  switch (name) {
    case 'overview':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" />
        </svg>
      )
    case 'mytasks':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="14" height="14" rx="3" />
          <path d="M7 10l2 2 4-4" />
        </svg>
      )
    case 'sprints':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 3L7 10h6l-4.5 7" />
        </svg>
      )
    case 'projects':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 4.5H15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
        </svg>
      )
    case 'backlog':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h12M4 10h12M4 14h8" />
        </svg>
      )
    case 'team':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="7" r="3" />
          <path d="M2 17c0-3 2.686-5 6-5s6 2 6 5" />
          <path d="M14 7a3 3 0 010 6M16 17c0-2.5-1.5-4-3-4.5" />
        </svg>
      )
    case 'clients':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="14" height="12" rx="2" />
          <path d="M7 4V2M13 4V2M6 9h8M6 12h5" />
        </svg>
      )
    case 'organization':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17h14M5 17V6l5-3 5 3v11M8 8h1M11 8h1M8 11h1M11 11h1M9 17v-3h2v3" />
        </svg>
      )
    case 'reports':
      return (
        <svg style={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15V10M8 15V7M12 15V11M16 15V5" />
        </svg>
      )
    default:
      return <span style={{ width: size, height: size, display: 'inline-block' }} />
  }
}
