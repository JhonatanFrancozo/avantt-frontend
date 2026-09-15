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
import type { Task } from '../core/types'

interface FiltrosTarefa {
  projetoId?: string
  sprintId?: number
  status?: string
}

function normalizarTarefa(task: Partial<Task> & { titulo?: string; nome?: string }): Task {
  return {
    id: String(task.id ?? ''),
    title: task.title ?? task.titulo ?? task.nome ?? '',
    project: task.project ?? '',
    sprint: task.sprint ?? '',
    assignee: task.assignee ?? '',
    avatar: task.avatar ?? '',
    avatarColor: task.avatarColor ?? '#9AA3B2',
    priority: (task.priority && task.priority in { crítica: true, alta: true, média: true, baixa: true } ? task.priority : 'média') as Task['priority'],
    status: (task.status ?? 'planejada') as Task['status'],
    daysDelayed: task.daysDelayed ?? 0,
    plannedEnd: task.plannedEnd ?? '',
    estimatedHours: task.estimatedHours ?? 0,
    blockedBy: task.blockedBy ?? null,
    tags: task.tags ?? [],
  }
}

export async function listarTarefas(filtros?: FiltrosTarefa): Promise<Task[]> {
  if (IS_MOCK) return mock.listarTarefas(filtros)
  const { data } = await api.get<Task[]>('/tarefas', { params: filtros })
  return data.map(normalizarTarefa)
}

export async function criarTarefa(body: Omit<Task, 'id'>): Promise<Task> {
  if (IS_MOCK) return mock.criarTarefa(body)
  const { data } = await api.post<Task>('/tarefas', body)
  return normalizarTarefa(data)
}



