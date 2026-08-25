/**
 * API de projetos — tabela `projeto` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/projetos
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Project } from '../core/types'

export async function listarProjetos(): Promise<Project[]> {
  if (IS_MOCK) return mock.listarProjetos()
  const { data } = await api.get<Project[]>('/projetos')
  return data
}

export async function criarProjeto(body: Omit<Project, 'id'>): Promise<Project> {
  if (IS_MOCK) return mock.criarProjeto(body)
  const { data } = await api.post<Project>('/projetos', body)
  return data
}



