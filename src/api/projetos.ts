
import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { Project } from '../types'
import { listarStatus } from './catalogos'

export async function listarProjetos(): Promise<Project[]> {
  console.log('IS_MOCK:', shouldUseMock())

  if (shouldUseMock()) {
    console.log('CARREGANDO PROJETOS DO MOCK')
    return mock.listarProjetos()
  }

  console.log('CARREGANDO PROJETOS DA API REAL')

  const { data } = await api.get<Project[]>('/projetos')

  console.log('PROJETOS RECEBIDOS DA API:', data)

  return data.map((project) => ({
    ...project,
    teamIds: Array.isArray(project.teamIds)
      ? project.teamIds.map(Number)
      : [],
    team: Array.isArray(project.team) ? project.team : [],
    risks: Array.isArray(project.risks) ? project.risks : [],
    milestones: Array.isArray(project.milestones)
      ? project.milestones
      : [],
    sprints: project.sprints ?? {
      total: 0,
      done: 0,
      active: 0,
      delayed: 0,
    },
    tasks: project.tasks ?? {
      total: 0,
      done: 0,
      delayed: 0,
      blocked: 0,
      cancelled: 0,
    },
  }))
}

export async function criarProjeto(
  body: Omit<Project, 'id'>
): Promise<Project> {
  if (shouldUseMock()) return mock.criarProjeto(body)

  const statuses = await listarStatus()

  const statusId = statuses.find(
    (item) =>
      item.nome.toLocaleLowerCase('pt-BR') ===
      body.status.toLocaleLowerCase('pt-BR')
  )?.id

  const { data } = await api.post<Project>('/projetos', {
    name: body.name,
    description: body.description,
    color: body.color,
    statusId: statusId ?? statuses.find(
      (item) =>
        item.nome.toLocaleLowerCase('pt-BR') === 'em andamento'
    )?.id,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId ?? null,
    team: body.teamIds ?? [],
    milestones: body.milestones ?? [],
    risks: body.risks ?? [],
  })

  return data
}

export async function obterProjeto(
  id: string | number
): Promise<Project> {
  if (shouldUseMock()) {
    const project = (await mock.listarProjetos()).find(
      (item) => String(item.id) === String(id)
    )

    if (!project) throw new Error('Projeto não encontrado.')

    return project
  }

  const { data } = await api.get<Project>(`/projetos/${id}`)

  return data
}

export async function atualizarProjeto(
  id: string | number,
  body: Partial<Project>
): Promise<Project> {
  if (shouldUseMock()) return mock.atualizarProjeto(id, body)

  const { data } = await api.put<Project>(`/projetos/${id}`, {
    name: body.name,
    description: body.description,
    color: body.color,
    status: body.status,
    startDate: body.startDate,
    endDate: body.endDate,
    clienteId: body.clientId,
    team: body.teamIds,
    milestones: body.milestones ?? [],
    risks: body.risks ?? [],
  })

  return data
}
