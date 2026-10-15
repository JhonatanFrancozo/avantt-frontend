import { c } from '../../theme'
import { DEV_NAV_ITEMS, DEV_CURRENT_USER } from '../../constants'
import Avatar from '../atoms/Avatar'
import BtnPrimary from '../atoms/BtnPrimary'
import NavIcon from '../NavIcon'
import type { DevPage, Project, SessionUser } from '../../types'

interface Props {
  active: DevPage
  onNav: (p: DevPage) => void
  projects: Project[]
  onLogout: () => void
  user?: SessionUser
  onProfile?: () => void
}

export default function DevSidebar({ active, onNav, projects, onLogout, user, onProfile }: Props) {
  return (
    <aside style={{ width: 220, minWidth: 220, backgroundColor: c.sidebar, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: `1px solid ${c.border}`, transition: 'background-color 0.3s' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#4B7BF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.textOnDark }}>AVANTT</div>
            <div style={{ fontSize: 10, color: c.textOnDarkMuted, marginTop: 1 }}>Gestão de TI</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#4B5A73', padding: '6px 10px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Menu</div>
        {DEV_NAV_ITEMS.map((item) => (
          <div key={item.page} onClick={() => onNav(item.page)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', backgroundColor: active === item.page ? c.sidebarActive : 'transparent', color: active === item.page ? c.textOnDark : c.textOnDarkMuted, fontSize: 13, fontWeight: active === item.page ? 600 : 400, marginBottom: 2 }}>
            <NavIcon name={item.icon} size={15} />
            {item.label}
            {active === item.page && <span style={{ marginLeft: 'auto', width: 3, height: 16, borderRadius: 2, backgroundColor: '#4B7BF5' }} />}
          </div>
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, color: '#4B5A73', padding: '14px 10px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projetos Ativos</div>
        {projects.map((p) => (
          <div key={p.id} onClick={() => onNav('devprojects')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', color: c.textOnDarkMuted, fontSize: 12, marginBottom: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
        ))}

      </nav>

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BtnPrimary variant="ghost" compact fullWidth onClick={onProfile} ariaLabel="Abrir meu perfil">
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: 0, padding: '4px 0', textAlign: 'left' }}>
              <Avatar i={user?.avatar ?? DEV_CURRENT_USER.avatar} color={user?.color ?? DEV_CURRENT_USER.color} size={32} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textOnDark, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? DEV_CURRENT_USER.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: c.textOnDarkMuted }}>{DEV_CURRENT_USER.role}</span>
              </span>
            </span>
          </BtnPrimary>
          <button onClick={onLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: c.textOnDarkMuted, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
