
/**
 * API de usuários — tabela usuario do schema.
 * IS_MOCK=true  → mock/db.ts (sem rede)
 * IS_MOCK=false → axios para /api/usuarios
 */

import { api, shouldUseMock } from './client'
import * as mock from './mock/db'
import type { AuthSession, Member, SessionUser } from '../types'
import { listarPerfis } from './catalogos'

function normalizeMember(user: Record<string, unknown>): Member {
  const name = String(user.name ?? user.nome ?? '')
  const papel = String(user.papel ?? user.appRole ?? '').toLowerCase()
  const cargo = String(user.cargo ?? user.role ?? '').toLowerCase()
  const appRole =
    papel.includes('manager') || papel.includes('gerent') || papel.includes('gestor')
      ? 'manager'
      : papel.includes('developer') || papel.includes('desenvol')
        ? 'developer'
        : cargo.includes('manager') || cargo.includes('gerent') || cargo.includes('gestor')
          ? 'manager'
          : cargo.includes('developer') || cargo.includes('desenvol')
            ? 'developer'
            : undefined

  const projectIds = Array.isArray(user.projectIds)
    ? user.projectIds.map(String)
    : []

  const projects = Array.isArray(user.projects)
    ? user.projects.map(String)
    : []

  return {
    id: String(user.id ?? ''),
    name,
    email: String(user.email ?? ''),
    cpf: user.cpf ? String(user.cpf) : undefined,

    phone: user.phone
      ? String(user.phone)
      : user.telefone
        ? String(user.telefone)
        : undefined,

    role: String(
      user.cargo ?? user.role ?? user.papel ?? 'Colaborador'
    ),
    appRole,

    avatar: String(
      user.avatar ??
      name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    ),

    color: String(user.color ?? '#4B7BF5'),

    projects,
    projectIds,

    tasks:
      typeof user.tasks === 'object' && user.tasks
        ? user.tasks as Member['tasks']
        : {
            total: 0,
            done: 0,
            delayed: 0,
            blocked: 0,
          },

    workload: Number(user.workload ?? 0),

    isActive: Boolean(user.active ?? user.isAtivo ?? true),
  }
}

async function memberToRequest(
  body: Omit<Member, 'id'>,
  appRole: 'manager' | 'developer'
) {
  const profiles = await listarPerfis()
  const candidates =
    appRole === 'manager'
      ? ['Gerente', 'Gestor', 'Administrador', 'Admin']
      : ['Desenvolvedor', 'Colaborador', 'Developer']

  const profile = candidates
    .map((candidate) =>
      profiles.find((item) =>
        item.nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR') ===
        candidate
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR')
      )
    )
    .find((item) => item)

  if (!profile) {
    throw new Error(
      `Perfil ${appRole === 'manager' ? 'Gerente' : 'Desenvolvedor'} não encontrado.`
    )
  }

  return {
    name: body.name,
    email: body.email,
    perfilId: profile.id,
    role: body.role || (appRole === 'manager' ? 'Gerente' : 'Desenvolvedor'),
    papel: appRole,
    phone: body.phone || undefined,
    cpf: body.cpf || undefined,
    projectIds: (body.projectIds ?? []).map(Number),
  }
}

export async function listarUsuarios(): Promise<Member[]> {
  if (shouldUseMock()) {
    return mock.listarUsuarios()
  }

  const { data } = await api.get<Record<string, unknown>[]>(
    '/usuarios'
  )

  return data.map(normalizeMember)
}

export async function convidarUsuario(
  body: Omit<Member, 'id'>
): Promise<Member> {
  if (shouldUseMock()) {
    return mock.criarUsuario({
      ...body,
      inviteStatus: 'pending',
      isActive: false,
    })
  }

  const { data } = await api.post<Record<string, unknown>>(
    '/usuarios',
    await memberToRequest(body, body.appRole ?? 'developer')
  )

  return normalizeMember(data)
}

export async function listarUsuariosDisponiveis(
  email: string
): Promise<Member[]> {
  const emailLimpo = email.trim().toLocaleLowerCase('pt-BR')
  if (!emailLimpo) return []

  if (shouldUseMock()) {
    return (await mock.listarUsuarios()).filter(
      (member) =>
        member.email.toLocaleLowerCase('pt-BR') === emailLimpo &&
        member.inviteStatus !== 'accepted'
    )
  }

  const { data } = await api.get<Record<string, unknown>[]>(
    '/usuarios/disponiveis',
    { params: { email: emailLimpo } }
  )

  return data.map(normalizeMember)
}

export async function vincularUsuarioPorEmail(
  email: string,
  projectIds: string[]
): Promise<Member> {
  const available = await listarUsuariosDisponiveis(email)
  const member = available[0]

  if (!member) {
    throw new Error('Não há uma conta pendente disponível para esse e-mail.')
  }

  if (shouldUseMock()) {
    const projectNames = (await mock.listarProjetos())
      .filter((project) => projectIds.includes(project.id))
      .map((project) => project.name)

    return mock.atualizarUsuario(member.id, {
      projects: [...new Set([...member.projects, ...projectNames])],
      projectIds: [...new Set([...(member.projectIds ?? []), ...projectIds])],
      inviteStatus: 'pending',
    })
  }

  for (const projectId of projectIds) {
    const { data: project } = await api.get<Record<string, unknown>>(
      `/projetos/${projectId}`
    )

    await api.put(`/projetos/${projectId}`, {
      name: String(project.name ?? ''),
      description: project.description ? String(project.description) : undefined,
      color: project.color ? String(project.color) : undefined,
      status: project.status ? String(project.status) : undefined,
      startDate: project.startDate,
      endDate: project.endDate,
      clienteId: project.clienteId ?? project.clientId ?? null,
      addTeam: [Number(member.id)],
    })
  }

  return member
}

export async function atualizarUsuario(
  id: string,
  body: Partial<Member>
): Promise<Member> {
  if (shouldUseMock()) {
    return mock.atualizarUsuario(id, body)
  }

  const request = {
    name: body.name,
    email: body.email,
    cpf: body.cpf || undefined,
    phone: body.phone || undefined,
    role: body.role,
    papel: body.appRole,
    active: body.isActive,
    projectIds: body.projectIds?.map((projectId) =>
      Number(projectId)
    ),
  }

  const { data } = await api.patch<Record<string, unknown>>(
    `/usuarios/${id}`,
    request
  )

  return normalizeMember(data)
}

export async function atualizarMeuPerfil(
  body: {
    email: string
    cpf?: string
    telefone?: string
  }
): Promise<SessionUser> {
  const rawSession =
    localStorage.getItem('avantt.session') ??
    sessionStorage.getItem('avantt.session')

  const session = rawSession
    ? JSON.parse(rawSession) as AuthSession
    : null

  if (!session) {
    throw new Error('Sessão não encontrada.')
  }

  if (shouldUseMock()) {
    return {
      ...session.user,
      email: body.email,
      cpf: body.cpf,
      phone: body.telefone,
    }
  }

  const { data } = await api.patch<Record<string, unknown>>(
    `/usuarios/${session.user.id}`,
    {
      email: body.email,
      cpf: body.cpf,
      phone: body.telefone,
    }
  )

  return {
    ...session.user,
    email: String(data.email ?? body.email),
    cpf: data.cpf ? String(data.cpf) : body.cpf,
    phone: data.phone ? String(data.phone) : body.telefone,
  }
}

export async function alterarMinhaSenha(
  body: {
    senhaAtual: string
    novaSenha: string
  }
): Promise<void> {
  if (shouldUseMock()) {
    if (body.novaSenha.length < 8) {
      throw new Error(
        'A nova senha deve ter pelo menos 8 caracteres.'
      )
    }

    return
  }

  await api.post('/auth/alterar-senha', body)
}
