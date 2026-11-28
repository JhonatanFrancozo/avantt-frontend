
/**
 * API de tarefas — tabela `tarefa` do schema.
 *
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/tarefas
 *
 * Filtros disponíveis:
 * projetoId → tarefa.projeto_id
 * sprintId  → tarefa.sprint_id
 * status    → tarefa.status_id (nome)
 */

import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { Task } from '../types'

type TaskResponse = Record<string, unknown>

/**
 * IDs dos status:
 * 1 = Planejada
 * 2 = Em andamento
 * 3 = Concluída
 * 4 = Bloqueada
 */
function obterStatusPorId(statusId: number): Task['status'] {
  switch (Number(statusId)) {
    case 1:
      return 'planejada'
    case 2:
      return 'em andamento'
    case 3:
      return 'concluída'
    case 4:
      return 'bloqueada'
    case 5:
      return 'revisão'
    case 6:
      return 'cancelada'
    default:
      throw new Error(`Status inválido: ${statusId}`)
  }
}

function normalizeStatus(
  value: unknown,
  statusId?: number
): Task['status'] {
  if (statusId != null) {
    return obterStatusPorId(statusId)
  }

  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')

  if (
    normalized === 'em andamento' ||
    normalized === 'in progress'
  ) {
    return 'em andamento'
  }

  if (
    normalized === 'concluida' ||
    normalized === 'done'
  ) {
    return 'concluída'
  }

  if (
    normalized === 'bloqueada' ||
    normalized === 'bloqueado' ||
    normalized === 'blocked'
  ) {
    return 'bloqueada'
  }

  if (normalized === 'revisao' || normalized === 'revisão') {
    return 'revisão'
  }

  if (normalized === 'cancelada' || normalized === 'cancelado') {
    return 'cancelada'
  }

  return 'planejada'
}

function normalizeTask(data: TaskResponse): Task {
  const statusId =
    data.statusId != null
      ? Number(data.statusId)
      : undefined

  const status = normalizeStatus(
    data.statusName ?? data.status,
    statusId
  )

  return {
    id: String(data.id),
    title: String(data.title ?? data.titulo ?? ''),

    project: String(data.project ?? ''),
    projectId:
      data.projectId != null
        ? Number(data.projectId)
        : undefined,

    sprint: String(data.sprint ?? ''),
    sprintId:
      data.sprintId != null
        ? Number(data.sprintId)
        : undefined,

    assignee: String(data.assignee ?? 'Não atribuído'),
    assigneeId:
      data.assigneeId != null
        ? Number(data.assigneeId)
        : undefined,

    avatar: String(data.avatar ?? ''),
    avatarColor: String(data.avatarColor ?? '#4B7BF5'),

    priority: String(data.priority ?? 'média')
      .toLocaleLowerCase('pt-BR') as Task['priority'],

    priorityId:
      data.priorityId != null
        ? Number(data.priorityId)
        : data.prioridadeId != null
          ? Number(data.prioridadeId)
          : undefined,

    status,

    statusId,

    daysDelayed: Number(data.daysDelayed ?? 0),
    plannedEnd: String(data.plannedEnd ?? ''),
    estimatedHours: Number(data.estimatedHours ?? 0),
    hoursSpent: data.hoursSpent != null ? Number(data.hoursSpent) : 0,
    startDate: data.startDate ? String(data.startDate).slice(0, 10) : undefined,

    blockedBy: data.blockedBy
      ? String(data.blockedBy)
      : null,

    tags: Array.isArray(data.tags)
      ? data.tags.map(String)
      : [],

    tagIds: Array.isArray(data.tagIds)
      ? data.tagIds.map(Number)
      : [],

    description: data.description
      ? String(data.description)
      : undefined,

    progress:
      data.progress != null
        ? Number(data.progress)
        : 0,
  }
}

interface FiltrosTarefa {
  projetoId?: string
  sprintId?: number
  status?: string
}

// ─── Listagem ────────────────────────────────────────────────────────────────

export async function listarTarefas(
  filtros?: FiltrosTarefa
): Promise<Task[]> {
  if (shouldUseMock()) {
    return mock.listarTarefas(filtros)
  }

  const { data } = await api.get<TaskResponse[]>('/tarefas', {
    params: filtros,
  })

  return data.map(normalizeTask)
}

// ─── Criação ─────────────────────────────────────────────────────────────────

export async function criarTarefa(
  body: Omit<Task, 'id'>
): Promise<Task> {
  if (shouldUseMock()) {
    return mock.criarTarefa(body)
  }

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
    hoursSpent: body.hoursSpent,
    startDate: body.startDate,
  })

  return normalizeTask({
    ...data,
    assignee: data.assignee ?? body.assignee,
    assigneeId: data.assigneeId ?? body.assigneeId,
  })
}

// ─── Atualização completa ────────────────────────────────────────────────────

export async function atualizarTarefa(
  id: string,
  body: Partial<Task>
): Promise<Task> {
  if (shouldUseMock()) {
    return mock.atualizarTarefa(id, body)
  }

  const numericId = String(id).replace(/\D/g, '')

  if (!numericId) {
    throw new Error('ID da tarefa inválido.')
  }

  const payload = {
    title: body.title,
    projectId: body.projectId,
    sprintId: body.sprintId,
    assigneeId: body.assigneeId,
    statusId: body.statusId,
    prioridadeId: body.priorityId,
    priority: body.priority,
    plannedEnd: body.plannedEnd,
    startDate: body.startDate,
    estimatedHours: body.estimatedHours,
    hoursSpent: body.hoursSpent,
    blockedBy: body.blockedBy,
    description: body.description,
    tagIds: body.tagIds ?? [],
  }

  const { data } = await api.put<TaskResponse>(
    `/tarefas/${numericId}`,
    payload
  )

  return normalizeTask({
    ...data,
    assignee: data.assignee ?? body.assignee,
    assigneeId: data.assigneeId ?? body.assigneeId,
  })
}

// ─── Atualização somente do status ───────────────────────────────────────────

export async function atualizarStatusTarefa(
  id: string,
  statusId: number,
  blockedBy?: string,
  startDate?: string,
  hoursSpent?: number
): Promise<Task> {
  const status = obterStatusPorId(statusId)

  if (shouldUseMock()) {
    return mock.atualizarTarefa(id, {
      status,
      statusId,
    })
  }

  const numericId = String(id).replace(/\D/g, '')

  if (!numericId) {
    throw new Error('ID da tarefa inválido.')
  }

  const { data } = await api.patch<TaskResponse>(
    `/tarefas/${numericId}/status`,
    {
      statusId,
      blockedBy: blockedBy || undefined,
      startDate: startDate || undefined,
      hoursSpent,
    }
  )

  return normalizeTask({
    ...data,
    id: data.id ?? numericId,
    statusId: data.statusId ?? statusId,
    statusName: data.statusName ?? status,
    status: data.status ?? status,
  })
}
