
import { useMemo, useState } from 'react'
import { useTheme, c } from './theme'
import { TODAY_STR } from './utils'
import * as api from './api'
import { txt } from './content'
import { Sidebar, PageHeader, DataState } from './components/layout'
import { BtnPrimary } from './components/atoms'
import {
  CreateProjectModal,
  CreateTaskModal,
  CreateSprintModal,
  CreateMemberModal,
  ProfileModal,
} from './modals'
import {
  OverviewPage,
  ProjectsPage,
  SprintsPage,
  BacklogPage,
  TeamPage,
  ReportsPage,
  ClientsPage,
  OrganizationPage,
} from './pages'
import type {
  Page,
  ActiveModal,
  Task,
  Project,
  Sprint,
  Member,
  MemberSubmission,
  SessionUser,
} from './types'
import useWorkspaceData from './hooks/useWorkspaceData'

const CAPACIDADE_SEMANAL = 40

function normalizarTexto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

function calcularCargaMembros(
  members: Member[],
  tasks: Task[],
): Member[] {
  return members.map((member) => {
    const nomeMembro = normalizarTexto(member.name)

    const horasEstimadas = tasks
      .filter((task) => {
        const status = normalizarTexto(String(task.status))

        // Não considera tarefas concluídas ou canceladas.
        if (
          status === 'concluida' ||
          status === 'concluido' ||
          status === 'cancelada' ||
          status === 'cancelado'
        ) {
          return false
        }

        // Prioriza o ID do responsável quando disponível.
        if (task.assigneeId != null) {
          return String(task.assigneeId) === String(member.id)
        }

        // Utiliza o nome como alternativa para os dados mockados.
        return (
          Boolean(task.assignee) &&
          normalizarTexto(task.assignee) === nomeMembro
        )
      })
      .reduce((total, task) => {
        const horas = Number(task.estimatedHours ?? 0)

        return total + (
          Number.isFinite(horas) && horas > 0 ? horas : 0
        )
      }, 0)

    const workload = Math.min(
      100,
      Math.round((horasEstimadas / CAPACIDADE_SEMANAL) * 100),
    )

    return {
      ...member,
      workload,
    }
  })
}

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

  const {
    projects,
    tasks,
    sprints,
    members,
    setData,
    loading,
    error,
    reload,
  } = useWorkspaceData()

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const scopedProjectIds = user?.projectIds

  const visibleProjects = useMemo(
    () =>
      scopedProjectIds
        ? projects.filter((project) =>
            scopedProjectIds.includes(project.id),
          )
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

  // Calcula a carga de trabalho a partir das tarefas de cada membro.
  const membersWithWorkload = useMemo(
    () => calcularCargaMembros(visibleMembers, visibleTasks),
    [visibleMembers, visibleTasks],
  )

  const canManageWorkspace = !scopedProjectIds

  function closeModal() {
    setActiveModal(null)
  }

  async function saveProject(body: Omit<Project, 'id'>) {
    console.log('DADOS RECEBIDOS DO MODAL:', {
      name: body.name,
      risks: body.risks,
      milestones: body.milestones,
    })

    try {
      if (editingProject) {
        const saved = await api.projetos.atualizarProjeto(
          editingProject.id,
          body,
        )

        console.log('PROJETO ATUALIZADO:', {
          id: saved.id,
          risks: saved.risks,
          milestones: saved.milestones,
        })

        setData((current) => ({
          ...current,
          projects: current.projects.map((project) =>
            project.id === saved.id ? saved : project,
          ),
        }))
      } else {
        const created = await api.projetos.criarProjeto(body)

        console.log('PROJETO CRIADO:', {
          id: created.id,
          risks: created.risks,
          milestones: created.milestones,
        })

        setData((current) => ({
          ...current,
          projects: [...current.projects, created],
        }))
      }

      setEditingProject(null)
      closeModal()
    } catch (error) {
      console.error('ERRO AO SALVAR PROJETO:', error)
      throw error
    }
  }

  async function saveTask(body: Omit<Task, 'id'>) {
    console.log('1. DADOS RECEBIDOS DO MODAL:', body)

    console.log('2. RESPONSÁVEL RECEBIDO:', {
      assignee: body.assignee,
      assigneeId: body.assigneeId,
    })

    try {
      const created = await api.tarefas.criarTarefa(body)

      console.log('3. RESPOSTA DA API:', created)

      console.log('4. RESPONSÁVEL RETORNADO PELA API:', {
        assignee: created.assignee,
        assigneeId: created.assigneeId,
      })

      setData((current) => ({
        ...current,
        tasks: [...current.tasks, created],
      }))

      closeModal()
    } catch (error) {
      console.error('ERRO AO CRIAR TAREFA:', error)
      throw error
    }
  }

  async function saveSprint(body: Omit<Sprint, 'id'>) {
    if (editingSprint) {
      const updated = await api.sprints.atualizarSprint(editingSprint.id, body)

      setData((current) => ({
        ...current,
        sprints: current.sprints.map((sprint) =>
          sprint.id === updated.id ? updated : sprint,
        ),
      }))
    } else {
      const created = await api.sprints.criarSprint(body)

      setData((current) => ({
        ...current,
        sprints: [...current.sprints, created],
      }))
    }

    setEditingSprint(null)
    closeModal()
  }

  async function saveMember(submission: MemberSubmission) {
    await api.usuarios.convidarUsuario(submission.member)
    const [refreshedMembers, refreshedProjects] = await Promise.all([
      api.usuarios.listarUsuarios(),
      api.projetos.listarProjetos(),
    ])

    setData((current) => ({
      ...current,
      members: refreshedMembers,
      projects: refreshedProjects,
    }))

    closeModal()
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

  if (loading || error) {
    return (
      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
      />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: c.bg,
        transition: 'background-color 0.3s',
      }}
    >
      <Sidebar
        active={page}
        onNav={setPage}
        projects={visibleProjects}
        user={user}
        onProfile={user ? () => setProfileOpen(true) : undefined}
        onLogout={onLogout ?? (() => {})}
      />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <PageHeader
          title={pageTitle[page]}
          subtitle={page === 'overview' ? TODAY_STR : undefined}
          dark={dark}
          onToggle={toggle}
          user={user}
          onProfile={user ? () => setProfileOpen(true) : undefined}
        >
          {canManageWorkspace && page === 'projects' && (
            <BtnPrimary onClick={() => setActiveModal('project')}>
              {txt.btn.novoProjeto}
            </BtnPrimary>
          )}

          {canManageWorkspace && page === 'sprints' && (
            <BtnPrimary onClick={() => setActiveModal('sprint')}>
              {txt.btn.novaSprint}
            </BtnPrimary>
          )}

          {canManageWorkspace && page === 'backlog' && (
            <BtnPrimary onClick={() => setActiveModal('task')}>
              {txt.btn.novaTarefa}
            </BtnPrimary>
          )}

          {canManageWorkspace && page === 'team' && (
            <BtnPrimary onClick={() => setActiveModal('member')}>
              {txt.btn.adicionarMembro}
            </BtnPrimary>
          )}
        </PageHeader>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {page === 'overview' && (
            <OverviewPage
              tasks={visibleTasks}
              sprints={visibleSprints}
              members={membersWithWorkload}
            />
          )}

          {page === 'projects' && (
            <ProjectsPage
              projects={visibleProjects}
              members={membersWithWorkload}
              onEditProject={(project) => {
                setEditingProject(project)
                setActiveModal('project')
              }}
            />
          )}

          {page === 'sprints' && (
            <SprintsPage
              sprints={visibleSprints}
              projects={visibleProjects}
              members={membersWithWorkload}
              onEditSprint={(sprint) => {
                setEditingSprint(sprint)
                setActiveModal('sprint')
              }}
            />
          )}

          {page === 'backlog' && (
            <BacklogPage
              tasks={visibleTasks}
              projects={visibleProjects}
              members={membersWithWorkload}
            />
          )}

          {page === 'team' && (
            <TeamPage
              members={membersWithWorkload}
              projects={visibleProjects}
            />
          )}

          {page === 'clients' && (
            <ClientsPage projects={projects} />
          )}

          {page === 'organization' && (
            <OrganizationPage />
          )}

          {page === 'reports' && (
            <ReportsPage
              tasks={visibleTasks}
              projects={visibleProjects}
              members={membersWithWorkload}
              sprints={visibleSprints}
            />
          )}
        </div>
      </main>

      {activeModal === 'project' && (
        <CreateProjectModal
          members={members}
          initial={editingProject ?? undefined}
          onClose={() => {
            setEditingProject(null)
            closeModal()
          }}
          onSave={saveProject}
        />
      )}

      {activeModal === 'task' && (
        <CreateTaskModal
          projects={projects}
          tasks={tasks}
          members={members}
          sprints={sprints}
          onClose={closeModal}
          onSave={saveTask}
        />
      )}

      {activeModal === 'sprint' && (
        <CreateSprintModal
          projects={projects}
          members={members}
          initial={editingSprint ?? undefined}
          onClose={() => {
            setEditingSprint(null)
            closeModal()
          }}
          onSave={saveSprint}
        />
      )}

      {activeModal === 'member' && (
        <CreateMemberModal
          projects={projects}
          onClose={closeModal}
          onSave={saveMember}
        />
      )}

      {profileOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={(updated) => onUserUpdate?.(updated)}
        />
      )}
    </div>
  )
}
