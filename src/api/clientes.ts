import { api, shouldUseMock } from './client'
import type { Client } from '../types'

let mockClients: Client[] = [
  {
    id: 1,
    organizationId: 1,
    name: 'Norte Comércio Digital',
    document: '45.123.987/0001-10',
    email: 'projetos@norte.com.br',
    phone: '(11) 4000-2020',
    createdAt: '2026-02-10T09:00:00',
  },
]

export type ClientInput = Omit<Client, 'id' | 'organizationId' | 'createdAt'>

function clientToRequest(body: Partial<ClientInput>) {
  return {
    name: body.name,
    document: body.document || undefined,
    email: body.email || undefined,
    phone: body.phone || undefined,
  }
}

function normalizeClient(data: Client): Client {
  const raw = data as Client & { dataCadastro?: string }
  return {
    ...raw,
    id: Number(raw.id),
    organizationId: raw.organizationId == null ? undefined : Number(raw.organizationId),
    name: String(raw.name ?? ''),
    document: String(raw.document ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    createdAt: raw.createdAt ?? raw.dataCadastro,
  }
}

export async function listarClientes(): Promise<Client[]> {
  if (shouldUseMock()) return structuredClone(mockClients)
  const { data } = await api.get<Client[]>('/clientes')
  return data.map(normalizeClient)
}

export async function criarCliente(body: ClientInput): Promise<Client> {
  if (shouldUseMock()) {
    const created = { ...body, id: Date.now(), organizationId: 1, createdAt: new Date().toISOString() }
    mockClients = [...mockClients, created]
    return structuredClone(created)
  }
  const { data } = await api.post<Client>('/clientes', clientToRequest(body))
  return normalizeClient(data)
}

export async function atualizarCliente(id: number, body: Partial<ClientInput>): Promise<Client> {
  if (shouldUseMock()) {
    const current = mockClients.find((client) => client.id === id)
    if (!current) throw new Error('Cliente não encontrado')
    const updated = { ...current, ...body }
    mockClients = mockClients.map((client) => client.id === id ? updated : client)
    return structuredClone(updated)
  }
  const { data } = await api.patch<Client>(`/clientes/${id}`, clientToRequest(body))
  return normalizeClient(data)
}
