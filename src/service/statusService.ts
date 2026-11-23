import { api } from './api';

export interface Status {
  id: number;
  nome: string;
  descricao: string;
}

export async function listarStatus(): Promise<Status[]> {
  const response = await api.get<Status[]>('/api/status');

  return response.data;
}
