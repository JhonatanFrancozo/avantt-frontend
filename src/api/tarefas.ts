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

interface FiltrosTarefa {
  projetoId?: string
  sprintId?: number
  status?: string
}

export async function listarTarefas(filtros?: FiltrosTarefa): Promise<Task[]> {
  if (IS_MOCK) return mock.listarTarefas(filtros)
  const { data } = await api.get<Task[]>('/tarefas', { params: filtros })
  return data
}

export async function criarTarefa(body: Omit<Task, 'id'>): Promise<Task> {
  if (IS_MOCK) return mock.criarTarefa(body)
  const { data } = await api.post<Task>('/tarefas', body)
  return data
}
