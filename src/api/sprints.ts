/**
 * API de sprints — tabela `sprint` do schema.
 * IS_MOCK=true  → mock/db.ts
 * IS_MOCK=false → axios para /api/sprints
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Sprint } from '../types'

export async function listarSprints(projetoId?: string): Promise<Sprint[]> {
  if (IS_MOCK) return mock.listarSprints(projetoId)
  const params = projetoId ? { projeto_id: projetoId } : undefined
  const { data } = await api.get<Sprint[]>('/sprints', { params })
  return data
}

export async function criarSprint(body: Omit<Sprint, 'id'>): Promise<Sprint> {
  if (IS_MOCK) return mock.criarSprint(body)
  const { data } = await api.post<Sprint>('/sprints', body)
  return data
}
