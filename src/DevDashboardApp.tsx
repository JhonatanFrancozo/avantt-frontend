import { useEffect, useMemo, useState, useRef } from 'react'
import { useTheme, c } from './theme'
import * as api from './api'
import { TODAY_STR } from './utils'
import { txt } from './content'
import DevSidebar from './components/layout/DevSidebar'
import { DataState, PageHeader } from './components/layout'
import DevOverviewPage from './pages/dev/DevOverviewPage'
import MyTasksPage from './pages/dev/MyTasksPage'
import SprintsPage from './pages/SprintsPage'
import ProjectsPage from './pages/ProjectsPage'
import BacklogPage from './pages/BacklogPage'
import ReportsPage from './pages/ReportsPage'
import { DEV_CURRENT_USER } from './constants'
import type { DevPage, SessionUser, Task } from './types'
import useWorkspaceData from './hooks/useWorkspaceData'
import { ProfileModal } from './modals'

const pageTitle: Record<DevPage, string> = {
  devoverview: 'Visão Geral',
  mytasks: 'Minhas Tarefas',
  devsprints: 'Sprint',
  devprojects: 'Projetos',
  devbacklog: 'Backlog',
  devreports: 'Relatórios',
}

function SprintSelector({ options }: { options: string[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(options[0] ?? DEV_CURRENT_USER.sprint)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1px solid ${open ? '#4B7BF5' : c.border}`, backgroundColor: open ? 'rgba(75,123,245,0.06)' : c.surface, fontSize: 12, color: open ? '#4B7BF5' : c.textSecondary, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 8h10M3 4h10M3 12h6"/></svg>
        {selected}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 9, boxShadow: '0 6px 18px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 140, overflow: 'hidden' }}>
          {options.map((sprint) => (
            <button
              key={sprint}
              onClick={() => { setSelected(sprint); setOpen(false) }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', backgroundColor: selected === sprint ? 'rgba(75,123,245,0.08)' : 'transparent', color: selected === sprint ? '#4B7BF5' : c.textPrimary, fontSize: 13, fontWeight: selected === sprint ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'background-color 0.1s' }}
              onMouseEnter={(e) => { if (selected !== sprint) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bg }}
              onMouseLeave={(e) => { if (selected !== sprint) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              {sprint}
              {sprint === DEV_CURRENT_USER.sprint && <span style={{ marginLeft: 6, fontSize: 10, color: '#37A066', fontWeight: 600 }}>atual</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DevDashboardApp({
  onLogout,
  user,
  onUserUpdate,
}: {
  onLogout?: () => void
  user?: SessionUser
  onUserUpdate?: (user: SessionUser) => void
}) {
  const { dark, toggle } = useTheme()
  const [page, setPage] = useState<DevPage>('devoverview')
  const [profileOpen, setProfileOpen] = useState(false)
  const { projects, tasks, sprints, members, setData, loading, error, reload } = useWorkspaceData()
  const currentName = user?.name ?? DEV_CURRENT_USER.name
  const developerTasks = useMemo(
    () => tasks.filter((task) => task.assignee === currentName),
    [currentName, tasks],
  )
  const sprintOptions = useMemo(
    () => [...new Set(sprints.map((sprint) => sprint.name))],
    [sprints],
  )

  async function updateTask(updated: Task) {
    const saved = await api.tarefas.atualizarTarefa(updated.id, updated)
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === saved.id ? saved : task),
    }))
  }

  if (loading || error) return <DataState loading={loading} error={error} onRetry={reload} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bg, transition: 'background-color 0.3s' }}>
      <DevSidebar active={page} onNav={setPage} projects={projects} user={user} onProfile={user ? () => setProfileOpen(true) : undefined} onLogout={onLogout ?? (() => {})} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PageHeader
          title={pageTitle[page]}
          subtitle={page === 'devoverview' ? TODAY_STR : undefined}
          dark={dark}
          onToggle={toggle}
          user={user}
          onProfile={user ? () => setProfileOpen(true) : undefined}
        >
          <SprintSelector options={sprintOptions} />
        </PageHeader>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {page === 'devoverview' && <DevOverviewPage tasks={developerTasks} projects={projects} />}
          {page === 'mytasks' && <MyTasksPage tasks={developerTasks} projects={projects} onUpdateTask={updateTask} />}
          {page === 'devsprints' && <SprintsPage sprints={sprints} projects={projects} members={members} onCreateSprint={() => {}} canCreate={false} />}
          {page === 'devprojects' && <ProjectsPage projects={projects} members={members} onCreateProject={() => {}} canCreate={false} />}
          {page === 'devbacklog' && <BacklogPage tasks={tasks} projects={projects} members={members} onCreateTask={() => {}} canCreate={false} />}
          {page === 'devreports' && <ReportsPage tasks={tasks} projects={projects} members={members} sprints={sprints} />}
        </div>
      </main>
      {profileOpen && user && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSaved={(updated) => onUserUpdate?.(updated)} />}
    </div>
  )
}
