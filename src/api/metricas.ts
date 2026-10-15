import { api, IS_MOCK } from './client'
import { INIT_MEMBERS, INIT_PROJECTS, INIT_TASKS } from '../constants'

export interface MetricPoint {
  label: string
  value: number
}

export interface OverdueMetric {
  id: string
  title: string
  daysDelayed: number
}

export interface ProjectMetrics {
  completionRate: number
  overdueCount: number
  hoursEstimated: number
  statusDistribution: MetricPoint[]
  tasksByMember: MetricPoint[]
  topOverdue: OverdueMetric[]
}

type UnknownRecord = Record<string, unknown>

function numberFrom(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key])
    if (Number.isFinite(value)) return value
  }
  return 0
}

function stringFrom(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') return value
  }
  return ''
}

function normalizePoints(data: unknown, labelKeys: string[], valueKeys: string[]): MetricPoint[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => {
    const record = item as UnknownRecord
    return {
      label: stringFrom(record, labelKeys),
      value: numberFrom(record, valueKeys),
    }
  }).filter((item) => item.label)
}

function mockMetrics(projectId: string | number): ProjectMetrics {
  const project = INIT_PROJECTS.find((item) => String(item.id) === String(projectId))
    ?? INIT_PROJECTS.find((item) => item.id.replace(/\D/g, '') === String(projectId))
  const tasks = project ? INIT_TASKS.filter((task) => task.project === project.name) : []
  const completed = tasks.filter((task) => task.status === 'Concluída').length
  const statusNames = ['Planejada', 'Em andamento', 'Concluída', 'Bloqueada']

  return {
    completionRate: Math.round((completed / (tasks.length || 1)) * 100),
    overdueCount: tasks.filter((task) => task.daysDelayed > 0).length,
    hoursEstimated: tasks.reduce((total, task) => total + task.estimatedHours, 0),
    statusDistribution: statusNames.map((status) => ({
      label: status,
      value: tasks.filter((task) => task.status === status).length,
    })),
    tasksByMember: INIT_MEMBERS.map((member) => ({
      label: member.name,
      value: tasks.filter((task) => task.assignee === member.name).length,
    })).filter((item) => item.value > 0),
    topOverdue: tasks
      .filter((task) => task.daysDelayed > 0)
      .sort((a, b) => b.daysDelayed - a.daysDelayed)
      .slice(0, 5)
      .map((task) => ({ id: task.id, title: task.title, daysDelayed: task.daysDelayed })),
  }
}

export async function obterMetricasProjeto(projectId: string | number): Promise<ProjectMetrics> {
  if (IS_MOCK) return mockMetrics(projectId)

  const [overviewResponse, statusResponse, overdueResponse, membersResponse] = await Promise.all([
    api.get<UnknownRecord>(`/metricas/project/${projectId}/overview`),
    api.get<unknown>(`/metricas/project/${projectId}/status-distribution`),
    api.get<unknown>(`/metricas/project/${projectId}/top-overdue`, { params: { limit: 5 } }),
    api.get<unknown>(`/metricas/project/${projectId}/tasks-by-member`),
  ])

  const overview = overviewResponse.data
  const completion = typeof overview.completion === 'object' && overview.completion
    ? overview.completion as UnknownRecord
    : overview

  return {
    completionRate: numberFrom(completion, ['completionRate', 'rate', 'percentage', 'percentual', 'value']),
    overdueCount: numberFrom(overview, ['overdueCount', 'atrasadas', 'totalAtrasadas']),
    hoursEstimated: numberFrom(overview, ['hoursEstimated', 'horasEstimadas']),
    statusDistribution: normalizePoints(
      statusResponse.data,
      ['statusName', 'status', 'nome', 'label'],
      ['count', 'total', 'quantidade', 'value'],
    ),
    tasksByMember: normalizePoints(
      membersResponse.data,
      ['memberName', 'userName', 'nome', 'label'],
      ['taskCount', 'count', 'total', 'quantidade', 'value'],
    ),
    topOverdue: Array.isArray(overdueResponse.data)
      ? overdueResponse.data.map((item) => {
        const record = item as UnknownRecord
        return {
          id: String(record.id ?? record.taskId ?? ''),
          title: stringFrom(record, ['title', 'titulo', 'taskName']),
          daysDelayed: numberFrom(record, ['daysDelayed', 'diasAtraso', 'delay']),
        }
      })
      : [],
  }
}
