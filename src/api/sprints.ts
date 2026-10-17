/**
 * API de sprints — tabela `sprint` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/sprints
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Sprint } from '../types'
import { listarStatus } from './catalogos'

export async function listarSprints(projetoId?: string): Promise<Sprint[]> {
  if (IS_MOCK) return mock.listarSprints(projetoId)
  const params = projetoId ? { projeto_id: projetoId } : undefined
  const { data } = await api.get<Sprint[]>('/sprints', { params })
  return data
}

export async function criarSprint(body: Omit<Sprint, 'id'>): Promise<Sprint> {
  if (IS_MOCK) return mock.criarSprint(body)
  const statuses = await listarStatus()
  const statusId = statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === 'em andamento')?.id
  const { data } = await api.post<Sprint>('/sprints', {
    name: body.name,
    projectId: body.projectId,
    startDate: body.startDate,
    endDate: body.endDate,
    statusId: body.statusId ?? statusId,
    team: body.teamIds ?? [],
  })
  return data
}

export async function listarUsuariosDaSprint(sprintId: number) {
  if (IS_MOCK) return []
  const { data } = await api.get<{ id: number; nome: string; email: string }[]>(`/sprints/${sprintId}/usuarios`)
  return data
}

export async function adicionarUsuarioNaSprint(sprintId: number, usuarioId: number) {
  if (IS_MOCK) return
  await api.post(`/sprints/${sprintId}/usuarios`, { usuarioId })
}

export async function removerUsuarioDaSprint(sprintId: number, usuarioId: number) {
  if (IS_MOCK) return
  await api.delete(`/sprints/${sprintId}/usuarios/${usuarioId}`)
}
