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
    sprint: String(data.sprint ?? ''),
    assignee: String(data.assignee ?? 'Não atribuído'),
    avatar: String(data.avatar ?? ''),
    avatarColor: String(data.avatarColor ?? '#4B7BF5'),
    priority: String(data.priority ?? 'média').toLocaleLowerCase('pt-BR') as Task['priority'],
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
    tagIds: body.tagIds ?? [],
    description: body.description,
    estimatedHours: body.estimatedHours,
  })
  return normalizeTask(data)
}

export async function atualizarTarefa(id: string, body: Partial<Task>): Promise<Task> {
  if (IS_MOCK) return mock.atualizarTarefa(id, body)
  const statusIds: Record<Task['status'], number> = {
    Planejada: 1,
    'Em andamento': 2,
    Concluída: 3,
    Bloqueada: 4,
  }
  const numericId = String(id).replace(/\D/g, '')
  const { data } = await api.patch<TaskResponse>(`/tarefas/${numericId}/status`, {
    statusId: body.statusId ?? (body.status ? statusIds[body.status] : undefined),
  })
  return normalizeTask(data)
}
