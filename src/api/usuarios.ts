/**
 * API de usuários — tabela `usuario` do schema.
 * IS_MOCK=true  → mock/db.ts (sem rede)
 * IS_MOCK=false → axios para /api/usuarios
 */
import { api, IS_MOCK } from './client'
import * as mock from './mock/db'
import type { AuthSession, Member, SessionUser } from '../types'
import { listarPerfis } from './catalogos'

function normalizeMember(user: Record<string, unknown>): Member {
  const name = String(user.name ?? user.nome ?? '')
  return {
    id: String(user.id),
    name,
    email: String(user.email ?? ''),
    cpf: user.cpf ? String(user.cpf) : undefined,
    phone: user.phone ? String(user.phone) : user.telefone ? String(user.telefone) : undefined,
    role: String(user.cargo ?? user.role ?? user.papel ?? 'Colaborador'),
    avatar: String(user.avatar ?? name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()),
    color: String(user.color ?? '#4B7BF5'),
    projects: Array.isArray(user.projects) ? user.projects.map(String) : [],
    projectIds: Array.isArray(user.projectIds)
      ? user.projectIds.map(String)
      : [],
    tasks: typeof user.tasks === 'object' && user.tasks
      ? user.tasks as Member['tasks']
      : { total: 0, done: 0, delayed: 0, blocked: 0 },
    workload: Number(user.workload ?? 0),
    isActive: Boolean(user.active ?? user.isAtivo ?? true),
  }
}

async function memberToRequest(body: Omit<Member, 'id'>, profileName: 'Admin' | 'Colaborador') {
  const profiles = await listarPerfis()
  const profile = profiles.find((item) => item.nome.toLocaleLowerCase('pt-BR') === profileName.toLocaleLowerCase('pt-BR'))
  if (!profile) throw new Error(`Perfil ${profileName} não encontrado.`)
  return {
    name: body.name,
    email: body.email,
    perfilId: profile.id,
    role: profileName,
    cargo: body.role || undefined,
    phone: body.phone || undefined,
    cpf: body.cpf || undefined,
    active: false,
    projectIds: body.projectIds ?? [],
  }
}

export async function listarUsuarios(): Promise<Member[]> {
  if (IS_MOCK) return mock.listarUsuarios()
  const { data } = await api.get<Record<string, unknown>[]>('/usuarios')
  return data.map(normalizeMember)
}

export async function convidarUsuario(body: Omit<Member, 'id'>): Promise<Member> {
  if (IS_MOCK) return mock.criarUsuario({ ...body, inviteStatus: 'pending', isActive: false })
  const { data } = await api.post<Record<string, unknown>>('/usuarios', await memberToRequest(body, 'Colaborador'))
  return normalizeMember(data)
}

export async function atualizarUsuario(id: string, body: Partial<Member>): Promise<Member> {
  if (IS_MOCK) return mock.atualizarUsuario(id, body)
  const request = {
    name: body.name,
    email: body.email,
    cpf: body.cpf || undefined,
    phone: body.phone || undefined,
    cargo: body.role,
    active: body.isActive,
    projectIds: body.projectIds?.map((projectId) => Number(projectId)),
  }
  const { data } = await api.patch<Record<string, unknown>>(`/usuarios/${id}`, request)
  return normalizeMember(data)
}

export async function atualizarMeuPerfil(body: { email: string; cpf?: string; telefone?: string }): Promise<SessionUser> {
  if (IS_MOCK) {
    const rawSession = localStorage.getItem('avantt.session') ?? sessionStorage.getItem('avantt.session')
    const session = rawSession ? JSON.parse(rawSession) as AuthSession : null
    if (!session) throw new Error('Sessão não encontrada.')
    return { ...session.user, email: body.email, cpf: body.cpf, phone: body.telefone }
  }
  const rawSession = localStorage.getItem('avantt.session') ?? sessionStorage.getItem('avantt.session')
  const session = rawSession ? JSON.parse(rawSession) as AuthSession : null
  if (!session) throw new Error('Sessão não encontrada.')
  const { data } = await api.patch<Record<string, unknown>>(`/usuarios/${session.user.id}`, {
    email: body.email,
    cpf: body.cpf,
    phone: body.telefone,
  })
  return {
    ...session.user,
    email: String(data.email ?? body.email),
    cpf: data.cpf ? String(data.cpf) : body.cpf,
    phone: data.phone ? String(data.phone) : body.telefone,
  }
}

export async function alterarMinhaSenha(body: { senhaAtual: string; novaSenha: string }): Promise<void> {
  if (IS_MOCK) {
    if (body.novaSenha.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.')
    return
  }
  await api.post('/auth/alterar-senha', body)
}
