/**
 * API de projetos — tabela `projeto` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/projetos
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Project } from '../types'
import { listarStatus } from './catalogos'

export async function listarProjetos(): Promise<Project[]> {
  if (IS_MOCK) return mock.listarProjetos()
  const { data } = await api.get<Project[]>('/projetos')
  return data.map((project) => ({
    ...project,
    teamIds: Array.isArray(project.teamIds) ? project.teamIds.map(Number) : [],
    team: Array.isArray(project.team) ? project.team : [],
    risks: Array.isArray(project.risks) ? project.risks : [],
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    sprints: project.sprints ?? { total: 0, done: 0, active: 0, delayed: 0 },
    tasks: project.tasks ?? { total: 0, done: 0, delayed: 0, blocked: 0, cancelled: 0 },
  }))
}

export async function criarProjeto(body: Omit<Project, 'id'>): Promise<Project> {
  if (IS_MOCK) return mock.criarProjeto(body)
  const statuses = await listarStatus()
  const statusId = statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === body.status.toLocaleLowerCase('pt-BR'))?.id
  const { data } = await api.post<Project>('/projetos', {
    name: body.name,
    description: body.description,
    color: body.color,
    statusId: statusId ?? statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === 'em andamento')?.id,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId ?? null,
    team: body.teamIds ?? [],
  })
  return data
}

export async function obterProjeto(id: string | number): Promise<Project> {
  if (IS_MOCK) {
    const project = (await mock.listarProjetos()).find((item) => String(item.id) === String(id))
    if (!project) throw new Error('Projeto não encontrado.')
    return project
  }
  const { data } = await api.get<Project>(`/projetos/${id}`)
  return data
}

export async function atualizarProjeto(id: string | number, body: Partial<Project>): Promise<Project> {
  if (IS_MOCK) throw new Error('Atualização de projeto não disponível no modo mock.')
  const statuses = await listarStatus()
  const statusId = body.status
    ? statuses.find((item) => item.nome.toLocaleLowerCase('pt-BR') === body.status?.toLocaleLowerCase('pt-BR'))?.id
    : undefined
  const { data } = await api.put<Project>(`/projetos/${id}`, {
    name: body.name,
    description: body.description,
    color: body.color,
    statusId,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId,
    team: body.teamIds,
  })
  return data
}
