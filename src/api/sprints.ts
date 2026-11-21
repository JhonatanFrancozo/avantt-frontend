/**
 * API de sprints — tabela `sprint` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/sprints
 */
import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import { listarStatus } from './catalogos'
import type { Sprint, SprintStatus } from '../types'
import { normalizeText } from '../utils'

async function getSprintStatusId(status: SprintStatus): Promise<number> {
  const catalogName = status === 'Finalizada' ? 'Concluída' : status
  const catalog = await listarStatus()
  const item = catalog.find((entry) => entry.nome.toLocaleLowerCase('pt-BR') === catalogName.toLocaleLowerCase('pt-BR'))
  if (!item) throw new Error(`O status "${catalogName}" não está disponível para a sprint.`)
  return item.id
}

function normalizeSprint(sprint: Sprint): Sprint {
  const status = ['Planejada', 'Em andamento', 'Finalizada'].find((item) => item === sprint.status) as SprintStatus | undefined
  return {
    ...sprint,
    status: status ?? 'Planejada',
    name: normalizeText(sprint.name),
    project: normalizeText(sprint.project),
    goal: normalizeText(sprint.goal),
    projectId: sprint.projectId == null ? undefined : Number(sprint.projectId),
    teamIds: Array.isArray(sprint.teamIds) ? sprint.teamIds.map(Number) : [],
    team: Array.isArray(sprint.team) ? sprint.team.map(normalizeText) : [],
  }
}

export async function listarSprints(projetoId?: string): Promise<Sprint[]> {
  if (shouldUseMock()) return mock.listarSprints(projetoId)
  const params = projetoId ? { projeto_id: projetoId } : undefined
  const { data } = await api.get<Sprint[]>('/sprints', { params })
  return data.map(normalizeSprint)
}

export async function criarSprint(body: Omit<Sprint, 'id'>): Promise<Sprint> {
  if (shouldUseMock()) return mock.criarSprint(body)
  const statusId = await getSprintStatusId(body.status)
  const { data } = await api.post<Sprint>('/sprints', {
    name: body.name,
    projectId: body.projectId,
    goal: body.goal,
    statusId,
    startDate: body.startDate,
    endDate: body.endDate,
    team: body.teamIds ?? [],
  })
  return normalizeSprint(data)
}

export async function atualizarSprint(id: number, body: Omit<Sprint, 'id'>): Promise<Sprint> {
  if (shouldUseMock()) return mock.atualizarSprint(id, body)
  const statusId = await getSprintStatusId(body.status)
  const { data } = await api.put<Sprint>(`/sprints/${id}`, {
    name: body.name,
    goal: body.goal,
    statusId,
    startDate: body.startDate,
    endDate: body.endDate,
    team: body.teamIds ?? [],
  })
  return normalizeSprint(data)
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
