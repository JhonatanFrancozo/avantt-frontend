export type TaskStatus = 'planejada' | 'em andamento' | 'revisão' | 'bloqueada' | 'concluída' | 'cancelada'
export type TaskPriority = 'crítica' | 'alta' | 'média' | 'baixa'
export type Page = 'overview' | 'projects' | 'sprints' | 'backlog' | 'team' | 'reports'
export type ActiveModal = 'project' | 'task' | 'sprint' | 'member' | null

export interface Task {
  id: string
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
}

export interface Sprint {
  id: number
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
  workload: number
  email: string
}

export interface Project {
  id: string
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
  risks: string[]
  milestones: { name: string; date: string; done: boolean }[]
}


