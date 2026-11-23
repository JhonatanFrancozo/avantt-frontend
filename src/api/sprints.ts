/**
 * API de sprints — tabela `sprint` do schema.
 * Modo de demonstração/mock → mock/db.ts
 * Uso normal → axios para /api/sprints
 */
import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { Sprint, SprintStatus } from '../types'
import { listarStatus } from './catalogos'

function normalizeSprintStatus(status: string) {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')

  return normalized === 'finalizada' ? 'concluida' : normalized
}

async function resolveStatusId(status: SprintStatus = 'Em andamento') {
  const statuses = await listarStatus()
  const expectedStatus = normalizeSprintStatus(status)
  const statusId = statuses.find(
    (item) => normalizeSprintStatus(item.nome) === expectedStatus,
  )?.id

  if (statusId == null) {
    throw new Error(`Status de sprint "${status}" não encontrado.`)
  }

  return statusId
}

export async function listarSprints(projetoId?: string): Promise<Sprint[]> {
  if (shouldUseMock()) return mock.listarSprints(projetoId)
  const params = projetoId ? { projeto_id: projetoId } : undefined
  const { data } = await api.get<Sprint[]>('/sprints', { params })
  return data
}

export async function criarSprint(body: Omit<Sprint, 'id'>): Promise<Sprint> {
  if (shouldUseMock()) return mock.criarSprint(body)
  const statusId = body.statusId ?? await resolveStatusId(body.status)
  const { data } = await api.post<Sprint>('/sprints', {
    name: body.name,
    projectId: body.projectId,
    startDate: body.startDate,
    endDate: body.endDate,
    statusId: body.statusId ?? statusId,
    team: body.teamIds ?? [],
    goal: body.goal,
  })
  return data
}

export async function atualizarSprint(
  sprintId: number,
  body: Omit<Sprint, 'id'>,
): Promise<Sprint> {
  if (shouldUseMock()) return mock.atualizarSprint(sprintId, body)

  const statusId = body.statusId ?? await resolveStatusId(body.status)
  const { data } = await api.put<Sprint>(`/sprints/${sprintId}`, {
    name: body.name,
    projectId: body.projectId,
    startDate: body.startDate,
    endDate: body.endDate,
    statusId,
    team: body.teamIds ?? [],
    goal: body.goal,
  })

  return data
}

export async function listarUsuariosDaSprint(sprintId: number) {
  if (shouldUseMock()) return []
  const { data } = await api.get<{ id: number; nome: string; email: string }[]>(`/sprints/${sprintId}/usuarios`)
  return data
}

export async function adicionarUsuarioNaSprint(sprintId: number, usuarioId: number) {
  if (shouldUseMock()) return
  await api.post(`/sprints/${sprintId}/usuarios`, { usuarioId })
}

export async function removerUsuarioDaSprint(sprintId: number, usuarioId: number) {
  if (shouldUseMock()) return
  await api.delete(`/sprints/${sprintId}/usuarios/${usuarioId}`)
}
