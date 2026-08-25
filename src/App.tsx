import { useState, useEffect } from 'react'
import { useTheme, c } from './core/theme'
import { TODAY_STR } from './core/utils'
import * as api from './api'
import { txt } from './core/content'
import { Sidebar, PageHeader } from './components/layout'
import { BtnPrimary } from './components/atoms'
import { CreateProjectModal, CreateTaskModal, CreateSprintModal, CreateMemberModal } from './modals'
import { OverviewPage, ProjectsPage, SprintsPage, BacklogPage, TeamPage, ReportsPage } from './pages'
import type { Page, ActiveModal, Task, Project, Sprint, Member } from './core/types'

export default function App() {
  const { dark, toggle } = useTheme()
  const [page, setPage] = useState<Page>('overview')
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // Carrega dados iniciais via API (mock ou real, conforme IS_MOCK)
  useEffect(() => {
    Promise.all([
      api.projetos.listarProjetos(),
      api.tarefas.listarTarefas(),
      api.sprints.listarSprints(),
      api.usuarios.listarUsuarios(),
    ]).then(([p, t, s, m]) => {
      setProjects(p)
      setTasks(t)
      setSprints(s)
      setMembers(m)
      setLoading(false)
    })
  }, [])

  function closeModal() { setActiveModal(null) }

  async function saveProject(body: Omit<Project, 'id'>) {
    const created = await api.projetos.criarProjeto(body)
    setProjects((ps) => [...ps, created])
    closeModal()
  }

  async function saveTask(body: Omit<Task, 'id'>) {
    const created = await api.tarefas.criarTarefa(body)
    setTasks((ts) => [...ts, created])
    closeModal()
  }

  async function saveSprint(body: Omit<Sprint, 'id'>) {
    const created = await api.sprints.criarSprint(body)
    setSprints((ss) => [...ss, created])
    closeModal()
  }

  async function saveMember(body: Omit<Member, 'id'>) {
    const created = await api.usuarios.criarUsuario(body)
    setMembers((ms) => [...ms, created])
    // A sincronização de projeto_usuario já é feita pelo mock/db ou pelo backend real
    const updatedProjects = await api.projetos.listarProjetos()
    setProjects(updatedProjects)
    closeModal()
  }

  async function updateMember(updated: Member) {
    const saved = await api.usuarios.atualizarUsuario(updated.id, updated)
    setMembers((ms) => ms.map((m) => (m.id === saved.id ? saved : m)))
    const updatedProjects = await api.projetos.listarProjetos()
    setProjects(updatedProjects)
  }

  const PAGE_TITLE: Record<Page, string> = {
    overview: txt.pagina.visaoGeral,
    projects: txt.pagina.projetos,
    sprints: txt.pagina.sprints,
    backlog: txt.pagina.backlog,
    team: txt.pagina.equipe,
    reports: txt.pagina.relatorios,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: c.bg, color: c.textMuted, fontSize: 14 }}>
        {txt.geral.carregando}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bg, transition: 'background-color 0.3s' }}>
      <Sidebar active={page} onNav={setPage} projects={projects} />

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PageHeader title={PAGE_TITLE[page]} subtitle={page === 'overview' ? TODAY_STR : undefined} dark={dark} onToggle={toggle}>
          {page === 'projects' && <BtnPrimary onClick={() => setActiveModal('project')}>{txt.btn.novoProjeto}</BtnPrimary>}
          {page === 'sprints' && <BtnPrimary onClick={() => setActiveModal('sprint')}>{txt.btn.novaSprint}</BtnPrimary>}
          {page === 'backlog' && <BtnPrimary onClick={() => setActiveModal('task')}>{txt.btn.novaTarefa}</BtnPrimary>}
          {page === 'team' && <BtnPrimary onClick={() => setActiveModal('member')}>{txt.btn.adicionarMembro}</BtnPrimary>}
        </PageHeader>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {page === 'overview' && <OverviewPage tasks={tasks} sprints={sprints} members={members} />}
          {page === 'projects' && <ProjectsPage projects={projects} members={members} onCreateProject={() => setActiveModal('project')} />}
          {page === 'sprints' && <SprintsPage sprints={sprints} projects={projects} members={members} onCreateSprint={() => setActiveModal('sprint')} />}
          {page === 'backlog' && <BacklogPage tasks={tasks} projects={projects} members={members} onCreateTask={() => setActiveModal('task')} />}
          {page === 'team' && <TeamPage members={members} projects={projects} onAddMember={() => setActiveModal('member')} onUpdateMember={updateMember} />}
          {page === 'reports' && <ReportsPage tasks={tasks} projects={projects} members={members} sprints={sprints} />}
        </div>
      </main>

      {activeModal === 'project' && <CreateProjectModal members={members} onClose={closeModal} onSave={saveProject} />}
      {activeModal === 'task' && <CreateTaskModal projects={projects} tasks={tasks} members={members} onClose={closeModal} onSave={saveTask} />}
      {activeModal === 'sprint' && <CreateSprintModal projects={projects} members={members} onClose={closeModal} onSave={saveSprint} />}
      {activeModal === 'member' && <CreateMemberModal projects={projects} onClose={closeModal} onSave={saveMember} />}
    </div>
  )
}



