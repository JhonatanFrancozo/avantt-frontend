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
      const [projects, tasks, sprints, members] = await Promise.all([
        api.projetos.listarProjetos(),
        api.tarefas.listarTarefas(),
        api.sprints.listarSprints(),
        api.usuarios.listarUsuarios(),
      ])
      setData({ projects, tasks, sprints, members })
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
