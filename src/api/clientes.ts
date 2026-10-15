import { api, IS_MOCK } from './client'
import type { Client } from '../types'
import type { CreateUserRequest } from '../types'

let mockClients: Client[] = [
  {
    id: 1,
    organizationId: 1,
    name: 'Norte Comércio Digital',
    document: '45.123.987/0001-10',
    email: 'projetos@norte.com.br',
    phone: '(11) 4000-2020',
    createdAt: '2026-02-10T09:00:00',
    defaultUser: {
      name: 'Marina Costa',
      email: 'marina@norte.com.br',
      status: 'invite-pending',
      role: 'manager',
      projectIds: ['p1'],
    },
  },
]

export type ClientInput = Omit<Client, 'id' | 'organizationId' | 'createdAt'>

function managerToRequest(user: NonNullable<ClientInput['defaultUser']>): CreateUserRequest {
  return {
    nome: user.name,
    email: user.email,
    cpf: undefined,
    telefone: undefined,
    cargo: 'Gestor',
    papel: 'Gestor',
    perfil: 'Gestor',
    senha: undefined,
    is_ativo: false,
    projeto_ids: user.projectIds,
  }
}

function clientToRequest(body: ClientInput) {
  return {
    nome: body.name,
    documento: body.document || undefined,
    email: body.email || undefined,
    telefone: body.phone || undefined,
    usuario_gestor: body.defaultUser?.email ? managerToRequest(body.defaultUser) : undefined,
  }
}

export async function listarClientes(): Promise<Client[]> {
  if (IS_MOCK) return structuredClone(mockClients)
  const { data } = await api.get<Client[]>('/clientes')
  return data
}

export async function criarCliente(body: ClientInput): Promise<Client> {
  if (IS_MOCK) {
    const created = { ...body, id: Date.now(), organizationId: 1, createdAt: new Date().toISOString() }
    mockClients = [...mockClients, created]
    return structuredClone(created)
  }
  const { data } = await api.post<Client>('/clientes', clientToRequest(body))
  return data
}

export async function atualizarCliente(id: number, body: Partial<ClientInput>): Promise<Client> {
  if (IS_MOCK) {
    const current = mockClients.find((client) => client.id === id)
    if (!current) throw new Error('Cliente não encontrado')
    const updated = { ...current, ...body }
    mockClients = mockClients.map((client) => client.id === id ? updated : client)
    return structuredClone(updated)
  }
  const { data } = await api.patch<Client>(`/clientes/${id}`, clientToRequest(body as ClientInput))
  return data
}
