/**
 * API de tarefas — tabela `tarefa` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/tarefas
 *
 * Filtros disponíveis espelham as FKs do schema:
 *   projetoId  → tarefa.projeto_id
 *   sprintId   → tarefa.sprint_id
 *   status     → tarefa.status_id (nome)
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Task } from '../types'

type TaskResponse = Record<string, unknown>

function normalizeStatus(value: unknown): Task['status'] {
  const normalized = String(value ?? '').toLocaleLowerCase('pt-BR')
  if (normalized === 'em andamento') return 'Em andamento'
  if (normalized === 'concluída' || normalized === 'concluida') return 'Concluída'
  if (normalized === 'bloqueada') return 'Bloqueada'
  return 'Planejada'
}

function normalizeTask(data: TaskResponse): Task {
  return {
    id: String(data.id),
    title: String(data.title ?? data.titulo ?? ''),
    project: String(data.project ?? ''),
    projectId: data.projectId ? Number(data.projectId) : undefined,
    sprint: String(data.sprint ?? ''),
    sprintId: data.sprintId ? Number(data.sprintId) : undefined,
    assignee: String(data.assignee ?? 'Não atribuído'),
    assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
    avatar: String(data.avatar ?? ''),
    avatarColor: String(data.avatarColor ?? '#4B7BF5'),
    priority: String(data.priority ?? 'média').toLocaleLowerCase('pt-BR') as Task['priority'],
    priorityId: data.priorityId ? Number(data.priorityId) : undefined,
    status: normalizeStatus(data.statusName ?? data.status),
    statusId: data.statusId ? Number(data.statusId) : undefined,
    daysDelayed: Number(data.daysDelayed ?? 0),
    plannedEnd: String(data.plannedEnd ?? ''),
    estimatedHours: Number(data.estimatedHours ?? 0),
    blockedBy: data.blockedBy ? String(data.blockedBy) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    tagIds: Array.isArray(data.tagIds) ? data.tagIds.map(Number) : [],
    description: data.description ? String(data.description) : undefined,
    progress: data.sprintProgress ? Number(data.sprintProgress) : undefined,
  }
}

interface FiltrosTarefa {
  projetoId?: string
  sprintId?: number
  status?: string
}

export async function listarTarefas(filtros?: FiltrosTarefa): Promise<Task[]> {
  if (IS_MOCK) return mock.listarTarefas(filtros)
  const { data } = await api.get<TaskResponse[]>('/tarefas', { params: filtros })
  return data.map(normalizeTask)
}

export async function criarTarefa(body: Omit<Task, 'id'>): Promise<Task> {
  if (IS_MOCK) return mock.criarTarefa(body)
  const { data } = await api.post<TaskResponse>('/tarefas', {
    title: body.title,
    projectId: body.projectId,
    sprintId: body.sprintId,
    assigneeId: body.assigneeId,
    statusId: body.statusId,
    plannedEnd: body.plannedEnd,
    priority: body.priority,
    prioridadeId: body.priorityId,
    tagIds: body.tagIds ?? [],
    description: body.description,
    estimatedHours: body.estimatedHours,
  })
  return normalizeTask(data)
}

export async function atualizarTarefa(id: string, body: Partial<Task>): Promise<Task> {
  if (IS_MOCK) return mock.atualizarTarefa(id, body)
  const numericId = String(id).replace(/\D/g, '')
  const { data } = await api.put<TaskResponse>(`/tarefas/${numericId}`, {
    title: body.title,
    projectId: body.projectId,
    sprintId: body.sprintId ?? null,
    assigneeId: body.assigneeId ?? null,
    statusId: body.statusId,
    prioridadeId: body.priorityId,
    priority: body.priority,
    plannedEnd: body.plannedEnd,
    estimatedHours: body.estimatedHours,
    blockedBy: body.blockedBy,
    description: body.description,
    tagIds: body.tagIds ?? [],
  })
  return normalizeTask(data)
}
