import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'
import type { Member, Project, Sprint, Task } from '../types'

export interface WorkspaceData {
  projects: Project[]
  tasks: Task[]
  sprints: Sprint[]
  members: Member[]
}

const emptyData: WorkspaceData = { projects: [], tasks: [], sprints: [], members: [] }

export default function useWorkspaceData() {
  const [data, setData] = useState<WorkspaceData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      async function optional<T>(request: Promise<T>): Promise<T | []> {
        try {
          return await request
        } catch (requestError) {
          const status = (requestError as { response?: { status?: number } })?.response?.status
          if (status === 404 || status === 500) return []
          throw requestError
        }
      }
      const [projects, tasks, sprints, members] = await Promise.all([
        optional(api.projetos.listarProjetos()),
        optional(api.tarefas.listarTarefas()),
        optional(api.sprints.listarSprints()),
        optional(api.usuarios.listarUsuarios()),
      ])
      setData({
        projects: projects as Project[],
        tasks: tasks as Task[],
        sprints: sprints as Sprint[],
        members: members as Member[],
      })
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...data, setData, loading, error, reload }
}
