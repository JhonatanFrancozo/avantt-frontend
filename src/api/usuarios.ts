/**
 * API de usuários — tabela `usuario` do schema.
 * IS_MOCK=true  → mock/db.ts (sem rede)
 * IS_MOCK=false → axios para /api/usuarios
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { Member } from '../core/types'

export async function listarUsuarios(): Promise<Member[]> {
  if (IS_MOCK) return mock.listarUsuarios()
  const { data } = await api.get<Member[]>('/usuarios')
  return data
}

export async function criarUsuario(body: Omit<Member, 'id'>): Promise<Member> {
  if (IS_MOCK) return mock.criarUsuario(body)
  const { data } = await api.post<Member>('/usuarios', body)
  return data
}

export async function atualizarUsuario(id: string, body: Partial<Member>): Promise<Member> {
  if (IS_MOCK) return mock.atualizarUsuario(id, body)
  const { data } = await api.patch<Member>(`/usuarios/${id}`, body)
  return data
}



