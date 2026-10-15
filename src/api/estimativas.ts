import { api, IS_MOCK } from './client'

export interface EstimateRequest {
  pessoas: number
  sprints: number
  limitePessoas: number
  limiteSprints: number
  prazo: number
  limiteTempo: number
  quantidadeDiasSprint: number
}

export interface EstimateResponse {
  tempoEstimado: number
  dentroPrazo: boolean
  tempoRestante: number
  pessoasCenarios: string[]
  sprintsCenarios: string[]
  melhorPessoas: number
  melhorSprints: number
  melhorTempo: number
  melhorMensagem: string
}

export async function calcularEstimativa(request: EstimateRequest): Promise<EstimateResponse> {
  if (IS_MOCK) {
    const tempoEstimado = (request.sprints * request.quantidadeDiasSprint) / request.pessoas
    const prazoDias = request.prazo / 480
    return {
      tempoEstimado,
      dentroPrazo: prazoDias >= tempoEstimado,
      tempoRestante: Math.max(prazoDias - tempoEstimado, 0),
      pessoasCenarios: [],
      sprintsCenarios: [],
      melhorPessoas: request.pessoas,
      melhorSprints: request.sprints,
      melhorTempo: tempoEstimado,
      melhorMensagem: `${request.pessoas} pessoa(s) em ${request.sprints} sprint(s): ${tempoEstimado.toFixed(1)} dias.`,
    }
  }
  const { data } = await api.post<EstimateResponse>('/estimativas/calc', request)
  return data
}
