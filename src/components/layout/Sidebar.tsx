import { c } from '../../core/theme'
import { NAV_ITEMS } from '../../core/constants'
import Avatar from '../atoms/Avatar'
import type { Page, Project } from '../../core/types'

interface Props {
  active: Page
  onNav: (p: Page) => void
  projects: Project[]
}

export default function Sidebar({ active, onNav, projects }: Props) {
  return (
    <aside style={{ width: 220, minWidth: 220, backgroundColor: c.sidebar, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: `1px solid ${c.border}`, transition: 'background-color 0.3s' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#4B7BF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>P</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.textOnDark }}>ProjectOps</div>
            <div style={{ fontSize: 10, color: c.textOnDarkMuted, marginTop: 1 }}>Gestão de TI</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#4B5A73', padding: '6px 10px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Menu</div>
        {NAV_ITEMS.map((item) => (
          <div key={item.page} onClick={() => onNav(item.page)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', backgroundColor: active === item.page ? c.sidebarActive : 'transparent', color: active === item.page ? c.textOnDark : c.textOnDarkMuted, fontSize: 13, fontWeight: active === item.page ? 600 : 400, marginBottom: 2 }}>
            <span style={{ fontSize: 11, width: 16, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {active === item.page && <span style={{ marginLeft: 'auto', width: 3, height: 16, borderRadius: 2, backgroundColor: '#4B7BF5' }} />}
          </div>
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, color: '#4B5A73', padding: '14px 10px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projetos Ativos</div>
        {projects.map((p) => (
          <div key={p.id} onClick={() => onNav('projects')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', color: c.textOnDarkMuted, fontSize: 12, marginBottom: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar i="GS" color="#4B7BF5" size={32} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.textOnDark }}>Gustavo Silva</div>
            <div style={{ fontSize: 11, color: c.textOnDarkMuted }}>Gerente de Projetos</div>
          </div>
        </div>
      </div>
    </aside>
  )
}



