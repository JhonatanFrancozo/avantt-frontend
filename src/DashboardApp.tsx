import { useMemo, useState } from 'react'
import { useTheme, c } from './theme'
import { TODAY_STR } from './utils'
import * as api from './api'
import { txt } from './content'
import { Sidebar, PageHeader, DataState } from './components/layout'
import { BtnPrimary } from './components/atoms'
import { CreateProjectModal, CreateTaskModal, CreateSprintModal, CreateMemberModal, ProfileModal } from './modals'
import { OverviewPage, ProjectsPage, SprintsPage, BacklogPage, TeamPage, ReportsPage, ClientsPage, OrganizationPage } from './pages'
import type { Page, ActiveModal, Task, Project, Sprint, Member, SessionUser } from './types'
import useWorkspaceData from './hooks/useWorkspaceData'

export default function DashboardApp({
  onLogout,
  user,
  onUserUpdate,
}: {
  onLogout?: () => void
  user?: SessionUser
  onUserUpdate?: (user: SessionUser) => void
}) {
  const { dark, toggle } = useTheme()
  const [page, setPage] = useState<Page>('overview')
  const { projects, tasks, sprints, members, setData, loading, error, reload } = useWorkspaceData()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const scopedProjectIds = user?.projectIds
  const visibleProjects = useMemo(
    () => scopedProjectIds
      ? projects.filter((project) => scopedProjectIds.includes(project.id))
      : projects,
    [projects, scopedProjectIds],
  )
  const visibleProjectNames = useMemo(
    () => new Set(visibleProjects.map((project) => project.name)),
    [visibleProjects],
  )
  const visibleTasks = scopedProjectIds
    ? tasks.filter((task) => visibleProjectNames.has(task.project))
    : tasks
  const visibleSprints = scopedProjectIds
    ? sprints.filter((sprint) => visibleProjectNames.has(sprint.project))
    : sprints
  const visibleMemberNames = useMemo(
    () => new Set(visibleProjects.flatMap((project) => project.team)),
    [visibleProjects],
  )
  const visibleMembers = scopedProjectIds
    ? members.filter((member) => visibleMemberNames.has(member.name))
    : members
  const canManageWorkspace = !scopedProjectIds

  function closeModal() { setActiveModal(null) }

  async function saveProject(body: Omit<Project, 'id'>) {
    const created = await api.projetos.criarProjeto(body)
    setData((current) => ({ ...current, projects: [...current.projects, created] }))
    closeModal()
  }

  async function saveTask(body: Omit<Task, 'id'>) {
    const created = await api.tarefas.criarTarefa(body)
    setData((current) => ({ ...current, tasks: [...current.tasks, created] }))
    closeModal()
  }

  async function saveSprint(body: Omit<Sprint, 'id'>) {
    const created = await api.sprints.criarSprint(body)
    setData((current) => ({ ...current, sprints: [...current.sprints, created] }))
    closeModal()
  }

  async function saveMember(body: Omit<Member, 'id'>) {
    const created = await api.usuarios.convidarUsuario(body)
    const refreshedProjects = await api.projetos.listarProjetos()
    setData((current) => ({ ...current, members: [...current.members, created], projects: refreshedProjects }))
    closeModal()
  }

  async function updateMember(updated: Member) {
    const saved = await api.usuarios.atualizarUsuario(updated.id, updated)
    const refreshedProjects = await api.projetos.listarProjetos()
    setData((current) => ({
      ...current,
      members: current.members.map((member) => (member.id === saved.id ? saved : member)),
      projects: refreshedProjects,
    }))
  }

  const pageTitle: Record<Page, string> = {
    overview: txt.pagina.visaoGeral,
    projects: txt.pagina.projetos,
    sprints: txt.pagina.sprints,
    backlog: txt.pagina.backlog,
    team: txt.pagina.equipe,
    clients: 'Clientes',
    organization: 'Organização',
    reports: txt.pagina.relatorios,
  }

  if (loading || error) return <DataState loading={loading} error={error} onRetry={reload} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bg, transition: 'background-color 0.3s' }}>
      <Sidebar active={page} onNav={setPage} projects={visibleProjects} user={user} onProfile={user ? () => setProfileOpen(true) : undefined} onLogout={onLogout ?? (() => {})} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PageHeader title={pageTitle[page]} subtitle={page === 'overview' ? TODAY_STR : undefined} dark={dark} onToggle={toggle} user={user} onProfile={user ? () => setProfileOpen(true) : undefined}>
          {canManageWorkspace && page === 'projects' && <BtnPrimary onClick={() => setActiveModal('project')}>{txt.btn.novoProjeto}</BtnPrimary>}
          {canManageWorkspace && page === 'sprints' && <BtnPrimary onClick={() => setActiveModal('sprint')}>{txt.btn.novaSprint}</BtnPrimary>}
          {canManageWorkspace && page === 'backlog' && <BtnPrimary onClick={() => setActiveModal('task')}>{txt.btn.novaTarefa}</BtnPrimary>}
          {canManageWorkspace && page === 'team' && <BtnPrimary onClick={() => setActiveModal('member')}>{txt.btn.adicionarMembro}</BtnPrimary>}
        </PageHeader>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {page === 'overview' && <OverviewPage tasks={visibleTasks} sprints={visibleSprints} members={visibleMembers} />}
          {page === 'projects' && <ProjectsPage projects={visibleProjects} members={visibleMembers} onCreateProject={() => setActiveModal('project')} canCreate={canManageWorkspace} />}
          {page === 'sprints' && <SprintsPage sprints={visibleSprints} projects={visibleProjects} members={visibleMembers} onCreateSprint={() => setActiveModal('sprint')} canCreate={canManageWorkspace} />}
          {page === 'backlog' && <BacklogPage tasks={visibleTasks} projects={visibleProjects} members={visibleMembers} onCreateTask={() => setActiveModal('task')} canCreate={canManageWorkspace} />}
          {page === 'team' && <TeamPage members={visibleMembers} projects={visibleProjects} onAddMember={() => setActiveModal('member')} onUpdateMember={updateMember} canManage={canManageWorkspace} />}
          {page === 'clients' && <ClientsPage projects={projects} />}
          {page === 'organization' && <OrganizationPage />}
          {page === 'reports' && <ReportsPage tasks={visibleTasks} projects={visibleProjects} members={visibleMembers} sprints={visibleSprints} />}
        </div>
      </main>
      {activeModal === 'project' && <CreateProjectModal members={members} onClose={closeModal} onSave={saveProject} />}
      {activeModal === 'task' && <CreateTaskModal projects={projects} tasks={tasks} members={members} sprints={sprints} onClose={closeModal} onSave={saveTask} />}
      {activeModal === 'sprint' && <CreateSprintModal projects={projects} members={members} onClose={closeModal} onSave={saveSprint} />}
      {activeModal === 'member' && <CreateMemberModal projects={projects} onClose={closeModal} onSave={saveMember} />}
      {profileOpen && user && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSaved={(updated) => onUserUpdate?.(updated)} />}
    </div>
  )
}
