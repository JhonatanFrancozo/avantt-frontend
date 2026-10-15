import { api, IS_MOCK } from './client'

export interface CatalogItem {
  id: number
  nome: string
  descricao?: string
}

const mockStatus: CatalogItem[] = [
  { id: 1, nome: 'Planejada' },
  { id: 2, nome: 'Em andamento' },
  { id: 3, nome: 'Concluída' },
  { id: 4, nome: 'Bloqueada' },
]

const mockPriorities: CatalogItem[] = [
  { id: 1, nome: 'Baixa' },
  { id: 2, nome: 'Média' },
  { id: 3, nome: 'Alta' },
]

const mockTags: CatalogItem[] = [
  { id: 1, nome: 'Backend' },
  { id: 2, nome: 'Frontend' },
]

export async function listarStatus(): Promise<CatalogItem[]> {
  if (IS_MOCK) return structuredClone(mockStatus)
  const { data } = await api.get<CatalogItem[]>('/status')
  return data
}

export async function listarPrioridades(): Promise<CatalogItem[]> {
  if (IS_MOCK) return structuredClone(mockPriorities)
  const { data } = await api.get<CatalogItem[]>('/prioridades')
  return data
}

export async function listarTags(): Promise<CatalogItem[]> {
  if (IS_MOCK) return structuredClone(mockTags)
  const { data } = await api.get<CatalogItem[]>('/tags')
  return data
}

export async function listarTagsDaTarefa(tarefaId: string | number): Promise<number[]> {
  if (IS_MOCK) return []
  const { data } = await api.get<number[]>(`/tarefas/${tarefaId}/tags`)
  return data
}

export async function listarPerfis(): Promise<CatalogItem[]> {
  if (IS_MOCK) {
    return [
      { id: 1, nome: 'Admin' },
      { id: 2, nome: 'Colaborador' },
    ]
  }
  const { data } = await api.get<CatalogItem[]>('/perfis')
  return data
}
