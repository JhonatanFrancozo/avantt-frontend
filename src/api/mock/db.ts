
/**
 * Banco de dados in-memory que simula as tabelas do schema task_manager.
 * Cada função retorna uma Promise com delay simulado para comportamento realista.
 * Usado quando VITE_USE_MOCK=true ou durante a demonstração.
 *
 * Tabelas do schema mapeadas aqui:
 *   usuario  → Member
 *   projeto  → Project
 *   sprint   → Sprint
 *   tarefa   → Task
 */

import type { Member, Project, Sprint, Task } from '../../types'
import {
  INIT_MEMBERS,
  INIT_PROJECTS,
  INIT_SPRINTS,
  INIT_TASKS,
} from '../../constants'

const delay = (ms = 120) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

// Cópias mutáveis isoladas do seed.
let _members: Member[] = structuredClone(INIT_MEMBERS)
let _projects: Project[] = structuredClone(INIT_PROJECTS)
let _sprints: Sprint[] = structuredClone(INIT_SPRINTS)
let _tasks: Task[] = structuredClone(INIT_TASKS)

// ─── Cálculo de progresso ─────────────────────────────────────────────────────

function recalcularProgressoProjeto(projetoId?: number | string) {
  if (projetoId == null) return

  const tarefasProjeto = _tasks.filter(
    (tarefa) =>
      String(tarefa.projectId) === String(projetoId) &&
      tarefa.status !== 'cancelada'
  )

  const total = tarefasProjeto.length

  const concluidas = tarefasProjeto.filter(
    (tarefa) => tarefa.status === 'concluída'
  ).length

  const bloqueadas = tarefasProjeto.filter(
    (tarefa) => tarefa.status === 'bloqueada'
  ).length

  const atrasadas = tarefasProjeto.filter(
    (tarefa) => tarefa.daysDelayed > 0 &&
      tarefa.status !== 'concluída'
  ).length

  const progresso = total > 0
    ? Math.round((concluidas / total) * 100)
    : 0

  _projects = _projects.map((projeto) => {
    if (String(projeto.id) !== String(projetoId)) {
      return projeto
    }

    return {
      ...projeto,
      progress: progresso,
      tasks: {
        ...projeto.tasks,
        total,
        done: concluidas,
        blocked: bloqueadas,
        delayed: atrasadas,
      },
    }
  })
}

function recalcularProgressoSprint(sprintId?: number) {
  if (sprintId == null) return

  const tarefasSprint = _tasks.filter(
    (tarefa) =>
      tarefa.sprintId === sprintId &&
      tarefa.status !== 'cancelada'
  )

  const total = tarefasSprint.length

  const concluidas = tarefasSprint.filter(
    (tarefa) => tarefa.status === 'concluída'
  ).length

  const progresso = total > 0
    ? Math.round((concluidas / total) * 100)
    : 0

  _sprints = _sprints.map((sprint) => {
    if (sprint.id !== sprintId) {
      return sprint
    }

    return {
      ...sprint,
      progress: progresso,
    }
  })
}

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

  const projeto = _projects.find(
    (p) => p.id === projetoId
  )

  return projeto
    ? all.filter((s) => s.project === projeto.name)
    : all
}

export async function listarTarefas(
  filtros?: {
    projetoId?: string
    sprintId?: number
    status?: string
  }
) {
  await delay()

  let result = structuredClone(_tasks)

  if (filtros?.projetoId) {
    const projeto = _projects.find(
      (p) => p.id === filtros.projetoId
    )

    if (projeto) {
      result = result.filter(
        (t) => t.project === projeto.name
      )
    }
  }

  if (filtros?.sprintId !== undefined) {
    const sprint = _sprints.find(
      (s) => s.id === filtros.sprintId
    )

    if (sprint) {
      result = result.filter(
        (t) => t.sprint === sprint.name
      )
    }
  }

  if (filtros?.status) {
    result = result.filter(
      (t) => t.status === filtros.status
    )
  }

  return result
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function criarUsuario(
  data: Omit<Member, 'id'>
): Promise<Member> {
  await delay()

  const novo: Member = {
    ...data,
    id: `m${Date.now()}`,
  }

  _members = [..._members, novo]

  // Sincroniza equipe dos projetos.
  _projects = _projects.map((p) =>
    novo.projects.includes(p.name) && !p.team.includes(novo.name)
      ? { ...p, team: [...p.team, novo.name] }
      : p
  )

  return structuredClone(novo)
}

export async function atualizarUsuario(
  id: string,
  data: Partial<Member>
): Promise<Member> {
  await delay()

  const atual = _members.find((m) => m.id === id)

  if (!atual) {
    throw new Error(`Usuário ${id} não encontrado`)
  }

  const atualizado: Member = {
    ...atual,
    ...data,
  }

  _members = _members.map((m) =>
    m.id === id ? atualizado : m
  )

  // Sincroniza projeto_usuario.
  _projects = _projects.map((p) => {
    const deveEstar = atualizado.projects.includes(p.name)
    const estaAtual = p.team.includes(atualizado.name)

    if (deveEstar && !estaAtual) {
      return {
        ...p,
        team: [...p.team, atualizado.name],
      }
    }

    if (!deveEstar && estaAtual) {
      return {
        ...p,
        team: p.team.filter((n) => n !== atualizado.name),
      }
    }

    return p
  })

  return structuredClone(atualizado)
}

export async function criarProjeto(
  data: Omit<Project, 'id'>
): Promise<Project> {
  await delay()

  const novo: Project = {
    ...data,
    id: `p${Date.now()}`,
  }

  _projects = [..._projects, novo]

  return structuredClone(novo)
}

export async function atualizarProjeto(
  id: string | number,
  data: Partial<Project>,
): Promise<Project> {
  await delay()

  const atual = _projects.find((project) => String(project.id) === String(id))

  if (!atual) {
    throw new Error(`Projeto ${id} não encontrado`)
  }

  const atualizado = { ...atual, ...data }
  _projects = _projects.map((project) =>
    String(project.id) === String(id) ? atualizado : project,
  )

  return structuredClone(atualizado)
}

export async function criarSprint(
  data: Omit<Sprint, 'id'>
): Promise<Sprint> {
  await delay()

  const maxId = _sprints.reduce(
    (max, sprint) => Math.max(max, sprint.id),
    0
  )

  const nova: Sprint = {
    ...data,
    id: maxId + 1,
  }

  _sprints = [..._sprints, nova]

  return structuredClone(nova)
}

export async function atualizarSprint(
  id: number,
  data: Omit<Sprint, 'id'>,
): Promise<Sprint> {
  await delay()

  const atual = _sprints.find((sprint) => sprint.id === id)

  if (!atual) {
    throw new Error(`Sprint ${id} não encontrada`)
  }

  const atualizada = { ...atual, ...data, id }
  _sprints = _sprints.map((sprint) =>
    sprint.id === id ? atualizada : sprint,
  )

  return structuredClone(atualizada)
}

export async function criarTarefa(
  data: Omit<Task, 'id'>
): Promise<Task> {
  await delay()

  const nums = _tasks
    .map((t) => parseInt(t.id.replace('T-', ''), 10))
    .filter(Boolean)

  const nextNum = nums.length
    ? Math.max(...nums) + 1
    : 1000

  const nova: Task = {
    ...data,
    id: `T-${nextNum}`,
  }

  _tasks = [..._tasks, nova]

  recalcularProgressoProjeto(nova.projectId)
  recalcularProgressoSprint(nova.sprintId)

  return structuredClone(nova)
}

export async function atualizarTarefa(
  id: string,
  data: Partial<Task>
): Promise<Task> {
  await delay()

  const atual = _tasks.find((t) => t.id === id)

  if (!atual) {
    throw new Error(`Tarefa ${id} não encontrada`)
  }

  const atualizada: Task = {
    ...atual,
    ...data,
  }

  _tasks = _tasks.map((t) =>
    t.id === id ? atualizada : t
  )

  // Atualiza o progresso do projeto e das sprints envolvidas.
  recalcularProgressoProjeto(atual.projectId)
  recalcularProgressoSprint(atual.sprintId)

  if (
    atualizada.projectId !== atual.projectId
  ) {
    recalcularProgressoProjeto(atualizada.projectId)
  }

  if (
    atualizada.sprintId !== atual.sprintId
  ) {
    recalcularProgressoSprint(atualizada.sprintId)
  }

  return structuredClone(atualizada)
}
