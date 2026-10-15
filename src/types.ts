export type TaskStatus = 'Planejada' | 'Em andamento' | 'Concluída' | 'Bloqueada'
export type TaskPriority = 'crítica' | 'alta' | 'média' | 'baixa'
export type TaskType = 'Feature' | 'Bug' | 'Melhoria' | 'Infra'
export type Page = 'overview' | 'projects' | 'sprints' | 'backlog' | 'team' | 'clients' | 'organization' | 'reports'
export type DevPage = 'devoverview' | 'mytasks' | 'devsprints' | 'devprojects' | 'devbacklog' | 'devreports'
export type ActiveModal = 'project' | 'task' | 'sprint' | 'member' | null
export type AppRole = 'manager' | 'developer'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: AppRole
  avatar?: string
  color?: string
  organizationId?: number
  organizationName?: string
  projectIds?: string[]
  cpf?: string
  phone?: string
}

export interface AuthSession {
  token: string
  user: SessionUser
}

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface SignupPayload {
  accountType: 'organization' | 'developer'
  name: string
  email: string
  password: string
  organizationName?: string
  cnpj?: string
}

export interface Organization {
  id: number
  tradeName: string
  legalName: string
  cnpj: string
  contact: string
  email: string
  phone: string
  createdAt?: string
}

export interface Client {
  id: number
  organizationId: number
  name: string
  document: string
  email: string
  phone: string
  createdAt?: string
  defaultUser?: {
    name: string
    email: string
    cpf?: string
    phone?: string
    jobTitle?: string
    status: 'invite-pending' | 'active'
    role: 'manager'
    projectIds: string[]
  }
}

export interface Task {
  id: string
  projectId?: number
  sprintId?: number
  assigneeId?: number
  statusId?: number
  priorityId?: number
  tagIds?: number[]
  title: string
  project: string
  sprint: string
  assignee: string
  avatar: string
  avatarColor: string
  priority: TaskPriority
  status: TaskStatus
  daysDelayed: number
  plannedEnd: string
  estimatedHours: number
  blockedBy: string | null
  tags: string[]
  taskType?: TaskType
  hoursSpent?: number
  progress?: number
  description?: string
}

export interface Sprint {
  id: number
  projectId?: number
  statusId?: number
  teamIds?: number[]
  name: string
  project: string
  startDate: string
  endDate: string
  daysDelayed: number
  progress: number
  totalTasks: number
  doneTasks: number
  blockedTasks: number
  team: string[]
  goal: string
}

export interface Member {
  id: string
  name: string
  avatar: string
  color: string
  role: string
  tasks: { total: number; done: number; delayed: number; blocked: number }
  projects: string[]
  projectIds?: string[]
  workload: number
  email: string
  phone?: string
  cpf?: string
  isActive?: boolean
  inviteStatus?: 'pending' | 'accepted'
}

export interface CreateUserRequest {
  nome: string
  email: string
  cpf?: string
  telefone?: string
  cargo?: string
  papel: 'Gestor' | 'Colaborador'
  perfil: 'Gestor' | 'Desenvolvedor'
  senha?: string
  is_ativo: boolean
  projeto_ids: string[]
}

export type UpdateUserRequest = Partial<Pick<
  CreateUserRequest,
  'nome' | 'email' | 'cpf' | 'telefone' | 'cargo' | 'papel' | 'is_ativo' | 'projeto_ids'
>>

export interface Project {
  id: string
  clientId?: number | null
  clientName?: string
  name: string
  color: string
  description: string
  status: string
  startDate: string
  endDate: string
  progress: number
  sprints: { total: number; done: number; active: number; delayed: number }
  tasks: { total: number; done: number; delayed: number; blocked: number; cancelled: number }
  team: string[]
  teamIds?: number[]
  risks: string[]
  milestones: { name: string; date: string; done: boolean }[]
}
