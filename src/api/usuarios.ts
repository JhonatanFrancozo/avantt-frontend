/**
 * API de usuários — tabela `usuario` do schema.
 * IS_MOCK=true  → mock/db.ts (sem rede)
 * IS_MOCK=false → axios para /api/usuarios
 */
import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { AuthSession, Member, SessionUser } from '../types'
import { listarPerfis } from './catalogos'
import { normalizeText } from '../utils'

function normalizeMember(user: Record<string, unknown>): Member {
  const name = normalizeText(user.name ?? user.nome ?? '')
  return {
    id: String(user.id),
    name,
    email: normalizeText(user.email ?? ''),
    cpf: user.cpf ? String(user.cpf) : undefined,
    phone: user.phone ? String(user.phone) : user.telefone ? String(user.telefone) : undefined,
    role: normalizeText(user.cargo ?? user.role ?? user.papel ?? 'Colaborador'),
    avatar: String(user.avatar ?? name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()),
    color: String(user.color ?? '#4B7BF5'),
    projects: Array.isArray(user.projects) ? user.projects.map(normalizeText) : [],
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
  if (shouldUseMock()) return mock.listarUsuarios()
  const { data } = await api.get<Record<string, unknown>[]>('/usuarios')
  return data.map(normalizeMember)
}

export async function listarUsuariosDisponiveis(): Promise<Member[]> {
  if (shouldUseMock()) return mock.listarUsuarios()
  const { data } = await api.get<Record<string, unknown>[]>('/usuarios/disponiveis')
  return data.map(normalizeMember)
}

export async function convidarUsuario(body: Omit<Member, 'id'>): Promise<Member> {
  if (shouldUseMock()) return mock.criarUsuario({ ...body, inviteStatus: 'pending', isActive: false })
  const { data } = await api.post<Record<string, unknown>>('/usuarios', await memberToRequest(body, 'Colaborador'))
  return normalizeMember(data)
}

export async function vincularUsuarioPorEmail(email: string, projectIds: string[]): Promise<Member> {
  if (shouldUseMock()) {
    const members = await mock.listarUsuarios()
    const member = members.find((item) =>
      item.email.toLocaleLowerCase('pt-BR') === email.toLocaleLowerCase('pt-BR'))
    if (!member) throw new Error('Usuário não encontrado pelo e-mail.')
    return member
  }

  const { data } = await api.get<Record<string, unknown>[]>('/usuarios/disponiveis')
  const found = data
    .map(normalizeMember)
    .find((member) => member.email.toLocaleLowerCase('pt-BR') === email.toLocaleLowerCase('pt-BR'))
  if (!found) throw new Error('Usuário não encontrado pelo e-mail.')

  for (const projectId of projectIds) {
    const { data: project } = await api.get<Record<string, unknown>>(`/projetos/${projectId}`)
    await api.put(`/projetos/${projectId}`, {
      name: String(project.name ?? ''),
      description: project.description ? String(project.description) : undefined,
      color: project.color ? String(project.color) : undefined,
      status: project.status ? String(project.status) : undefined,
      startDate: project.startDate,
      endDate: project.endDate,
      clienteId: project.clienteId ?? project.clientId ?? null,
      addTeam: [Number(found.id)],
    })
  }

  return found
}

export async function atualizarUsuario(id: string, body: Partial<Member>): Promise<Member> {
  if (shouldUseMock()) return mock.atualizarUsuario(id, body)
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

export async function atualizarMeuPerfil(body: { email: string; cpf: string; telefone: string }): Promise<SessionUser> {
  if (shouldUseMock()) {
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
    cpf: String(data.cpf ?? body.cpf),
    phone: String(data.phone ?? body.telefone),
  }
}

export async function alterarMinhaSenha(body: { senhaAtual: string; novaSenha: string }): Promise<void> {
  if (shouldUseMock()) {
    if (body.novaSenha.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.')
    return
  }
  await api.post('/auth/alterar-senha', body)
}
