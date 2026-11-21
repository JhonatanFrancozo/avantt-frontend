/**
 * API de projetos — tabela `projeto` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/projetos
 */
import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { Project } from '../types'
import { listarStatus } from './catalogos'
import { normalizeText } from '../utils'

type ProjectResponse = Project & {
  clienteId?: number | string | null
  clienteNome?: string
}

function normalizeProject(project: ProjectResponse): Project {
  const clientId = project.clientId ?? project.clienteId
  return {
    ...project,
    clientId: clientId == null ? null : Number(clientId),
    clientName: normalizeText(project.clientName ?? project.clienteNome),
    name: normalizeText(project.name),
    description: normalizeText(project.description),
    status: normalizeText(project.status),
    statusName: normalizeText(project.statusName ?? project.status),
    teamIds: Array.isArray(project.teamIds) ? project.teamIds.map(Number) : [],
    team: Array.isArray(project.team) ? project.team.map(normalizeText) : [],
    risks: Array.isArray(project.risks) ? project.risks : [],
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    sprints: project.sprints ?? { total: 0, done: 0, active: 0, delayed: 0 },
    tasks: project.tasks ?? { total: 0, done: 0, delayed: 0, blocked: 0, cancelled: 0 },
  }
}

export async function listarProjetos(): Promise<Project[]> {
  if (shouldUseMock()) return mock.listarProjetos()
  const { data } = await api.get<ProjectResponse[]>('/projetos')
  return data.map(normalizeProject)
}

export async function criarProjeto(body: Omit<Project, 'id'>): Promise<Project> {
  if (shouldUseMock()) return mock.criarProjeto(body)
  const statuses = await listarStatus()
  const statusId = statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === body.status.toLocaleLowerCase('pt-BR'))?.id
  const { data } = await api.post<ProjectResponse>('/projetos', {
    name: body.name,
    description: body.description,
    color: body.color,
    status: body.status,
    statusId: statusId ?? statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === 'em andamento')?.id,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId ?? null,
    team: body.teamIds ?? [],
  })
  return normalizeProject(data)
}

export async function obterProjeto(id: string | number): Promise<Project> {
  if (shouldUseMock()) {
    const project = (await mock.listarProjetos()).find((item) => String(item.id) === String(id))
    if (!project) throw new Error('Projeto não encontrado.')
    return project
  }
  const { data } = await api.get<ProjectResponse>(`/projetos/${id}`)
  return normalizeProject(data)
}

export async function atualizarProjeto(id: string | number, body: Partial<Project>): Promise<Project> {
  if (shouldUseMock()) throw new Error('Atualização de projeto não disponível no modo mock.')
  const statuses = await listarStatus()
  const statusId = body.status
    ? statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === body.status?.toLocaleLowerCase('pt-BR'))?.id
    : undefined
  const { data } = await api.put<ProjectResponse>(`/projetos/${id}`, {
    name: body.name,
    description: body.description,
    color: body.color,
    status: body.status,
    statusId,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId ?? null,
    team: body.teamIds,
  })
  return normalizeProject(data)
}
