/**
 * Banco de dados in-memory que simula as tabelas do schema task_manager.
 * Cada função retorna uma Promise com delay simulado para comportamento realista.
 * Trocar por chamadas axios reais: basta mudar IS_MOCK=false no client.ts.
 *
 * Tabelas do schema mapeadas aqui:
 *   usuario  → Member
 *   projeto  → Project
 *   sprint   → Sprint
 *   tarefa   → Task
 */
import type { Member, Project, Sprint, Task } from '../../types'
import { INIT_MEMBERS, INIT_PROJECTS, INIT_SPRINTS, INIT_TASKS } from '../../constants'

const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms))

// Cópias mutáveis isoladas do seed (não afeta os dados originais de constants.ts)
let _members: Member[] = structuredClone(INIT_MEMBERS)
let _projects: Project[] = structuredClone(INIT_PROJECTS)
let _sprints: Sprint[] = structuredClone(INIT_SPRINTS)
let _tasks: Task[] = structuredClone(INIT_TASKS)

// ─── Leitura ──────────────────────────────────────────────────────────────────

export async function listarUsuarios() {
  await delay()
  return structuredClone(_members)
}

export async function listarProjetos() {
  await delay()
  return structuredClone(_projects)
}

export async function listarSprints(projetoId?: string) {
  await delay()
  const all = structuredClone(_sprints)
  if (!projetoId) return all
  const proj = _projects.find((p) => p.id === projetoId)
  return proj ? all.filter((s) => s.project === proj.name) : all
}

export async function listarTarefas(filtros?: { projetoId?: string; sprintId?: number; status?: string }) {
  await delay()
  let result = structuredClone(_tasks)
  if (filtros?.projetoId) {
    const proj = _projects.find((p) => p.id === filtros.projetoId)
    if (proj) result = result.filter((t) => t.project === proj.name)
  }
  if (filtros?.sprintId !== undefined) {
    const sp = _sprints.find((s) => s.id === filtros.sprintId)
    if (sp) result = result.filter((t) => t.sprint === sp.name)
  }
  if (filtros?.status) result = result.filter((t) => t.status === filtros.status)
  return result
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function criarUsuario(data: Omit<Member, 'id'>): Promise<Member> {
  await delay()
  const novo: Member = { ...data, id: `m${Date.now()}` }
  _members = [..._members, novo]
  // Sincroniza equipe dos projetos (tabela projeto_usuario no schema)
  _projects = _projects.map((p) =>
    novo.projects.includes(p.name) && !p.team.includes(novo.name)
      ? { ...p, team: [...p.team, novo.name] }
      : p,
  )
  return structuredClone(novo)
}

export async function atualizarUsuario(id: string, data: Partial<Member>): Promise<Member> {
  await delay()
  const atual = _members.find((m) => m.id === id)
  if (!atual) throw new Error(`Usuário ${id} não encontrado`)
  const atualizado: Member = { ...atual, ...data }
  _members = _members.map((m) => (m.id === id ? atualizado : m))
  // Sincroniza projeto_usuario
  _projects = _projects.map((p) => {
    const deveEstar = atualizado.projects.includes(p.name)
    const estaAtual = p.team.includes(atualizado.name)
    if (deveEstar && !estaAtual) return { ...p, team: [...p.team, atualizado.name] }
    if (!deveEstar && estaAtual) return { ...p, team: p.team.filter((n) => n !== atualizado.name) }
    return p
  })
  return structuredClone(atualizado)
}

export async function criarProjeto(data: Omit<Project, 'id'>): Promise<Project> {
  await delay()
  const novo: Project = { ...data, id: `p${Date.now()}` }
  _projects = [..._projects, novo]
  return structuredClone(novo)
}

export async function criarSprint(data: Omit<Sprint, 'id'>): Promise<Sprint> {
  await delay()
  const maxId = _sprints.reduce((m, s) => Math.max(m, s.id), 0)
  const nova: Sprint = { ...data, id: maxId + 1 }
  _sprints = [..._sprints, nova]
  return structuredClone(nova)
}

export async function criarTarefa(data: Omit<Task, 'id'>): Promise<Task> {
  await delay()
  const nums = _tasks.map((t) => parseInt(t.id.replace('T-', ''), 10)).filter(Boolean)
  const nextNum = nums.length ? Math.max(...nums) + 1 : 1000
  const nova: Task = { ...data, id: `T-${nextNum}` }
  _tasks = [..._tasks, nova]
  return structuredClone(nova)
}
