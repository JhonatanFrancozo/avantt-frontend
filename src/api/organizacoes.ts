import { api, shouldUseMock } from './client'
import type { Organization } from '../types'
import type { AuthSession } from '../types'
import { normalizeText } from '../utils'

let mockOrganization: Organization = {
  id: 1,
  tradeName: 'AVANTT Tecnologia',
  legalName: 'AVANTT Tecnologia e Sistemas Ltda.',
  cnpj: '12.345.678/0001-90',
  email: 'contato@avantt.com.br',
  phone: '(11) 99999-0000',
  createdAt: '2026-01-15T10:00:00',
}

export async function obterMinhaOrganizacao(): Promise<Organization> {
  if (shouldUseMock()) return structuredClone(mockOrganization)
  const organizationId = getOrganizationId()
  const { data } = await api.get<Record<string, unknown>>(`/organizacoes/${organizationId}`)
  return normalizeOrganization(data)
}

export async function atualizarOrganizacao(body: Partial<Organization>): Promise<Organization> {
  if (shouldUseMock()) {
    mockOrganization = { ...mockOrganization, ...body }
    return structuredClone(mockOrganization)
  }
  const organizationId = getOrganizationId()
  const { data } = await api.put<Record<string, unknown>>(`/organizacoes/${organizationId}`, {
    id: organizationId,
    nomeFantasia: body.tradeName,
    razaoSocial: body.legalName?.trim() || undefined,
    cnpj: body.cnpj?.trim() || undefined,
    emailContato: body.email?.trim() || undefined,
    telefone: body.phone?.trim() || undefined,
  })
  return normalizeOrganization(data)
}

function getOrganizationId() {
  const raw = localStorage.getItem('avantt.session') ?? sessionStorage.getItem('avantt.session')
  const session = raw ? JSON.parse(raw) as AuthSession : null
  if (!session?.user.organizationId) throw new Error('Organização não vinculada ao usuário.')
  return session.user.organizationId
}

function normalizeOrganization(data: Record<string, unknown>): Organization {
  return {
    id: Number(data.id),
    tradeName: normalizeText(data.tradeName ?? data.nomeFantasia ?? ''),
    legalName: normalizeText(data.legalName ?? data.razaoSocial ?? ''),
    cnpj: normalizeText(data.cnpj ?? ''),
    email: normalizeText(data.email ?? data.emailContato ?? ''),
    phone: normalizeText(data.phone ?? data.telefone ?? ''),
    createdAt: data.createdAt ? String(data.createdAt) : data.dataCriacao ? String(data.dataCriacao) : undefined,
  }
}
