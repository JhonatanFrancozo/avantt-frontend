import { useState, useMemo } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, Textarea } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import { getApiErrorMessage } from '../api'
import type { Sprint, Project, Member, SprintStatus } from '../types'

interface Props {
  projects: Project[]
  members: Member[]
  initial?: Sprint
  onClose: () => void
  onSave: (s: Omit<Sprint, 'id'>) => Promise<void>
}

const sprintStatuses: SprintStatus[] = ['Planejada', 'Em andamento', 'Finalizada']

export default function CreateSprintModal({ projects, members, initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [project, setProject] = useState(initial?.project ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? '')
  const [goal, setGoal] = useState(initial?.goal ?? '')
  const [status, setStatus] = useState<SprintStatus>(initial?.status ?? 'Planejada')
  const [team, setTeam] = useState<string[]>(initial?.team ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  const listMembers = useMemo(
    () => {
      if (!project) return members

      const selectedProject = projects.find((item) => item.name === project)
      const projectTeamIds = new Set(
        (selectedProject?.teamIds ?? []).map(String)
      )
      const projectTeamNames = new Set(
        (selectedProject?.team ?? []).map((name) => name.trim().toLowerCase())
      )

      const filtered = members.filter((member) => {
        const memberId = String(member.id).replace(/\D/g, '')
        const memberName = member.name.trim().toLowerCase()
        return (
          projectTeamIds.has(memberId) ||
          projectTeamIds.has(String(member.id)) ||
          projectTeamNames.has(memberName) ||
          member.projectIds?.includes(String(selectedProject?.id).replace(/\D/g, '')) ||
          member.projects.includes(project)
        )
      })

      return filtered.length > 0 ? filtered : members
    },
    [project, members, projects],
  )

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!project) e.project = 'Projeto obrigatório'
    if (!startDate) e.startDate = 'Data de início obrigatória'
    if (!endDate) e.endDate = 'Data de fim obrigatória'
    if (startDate && endDate && startDate >= endDate) e.endDate = 'Data de fim deve ser após início'
    const periodChanged = !initial
      || startDate !== initial.startDate.slice(0, 10)
      || endDate !== initial.endDate.slice(0, 10)
    if (
      periodChanged &&
      startDate &&
      endDate &&
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 < 15
    ) {
      e.endDate = 'A sprint deve ter duração mínima de 15 dias'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setServerError('')
    if (!validate()) return
    const selectedProject = projects.find((item) => item.name === project)
    try {
      await onSave({
        name: name.trim(),
        project,
        projectId: initial?.projectId ?? (selectedProject ? Number(String(selectedProject.id).replace(/\D/g, '')) : undefined),
        status,
        startDate,
        endDate,
        daysDelayed: initial?.daysDelayed ?? 0,
        progress: initial?.progress ?? 0,
        totalTasks: initial?.totalTasks ?? 0,
        doneTasks: initial?.doneTasks ?? 0,
        blockedTasks: initial?.blockedTasks ?? 0,
        team,
        teamIds: members.filter((member) => team.includes(member.name)).map((member) => Number(member.id.replace(/\D/g, ''))),
        goal: goal.trim(),
      })
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  function toggleMember(memberName: string) {
    setTeam((t) => t.includes(memberName) ? t.filter((x) => x !== memberName) : [...t, memberName])
  }

  return (
    <Modal
      title={initial ? 'Editar Sprint' : 'Nova Sprint'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initial ? 'Salvar alterações' : 'Criar Sprint'}
      wide
    >
      {serverError && <div role="alert" style={{ marginBottom: 12, padding: '10px 12px', backgroundColor: c.redLight, color: c.red, borderRadius: 8, fontSize: 13 }}>{serverError}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome da sprint" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: Sprint 15" />
          </Field>
          <Field label="Projeto" required error={errors.project}>
            {initial
              ? <div style={{ padding: '9px 10px', color: c.textSecondary, backgroundColor: c.bg, borderRadius: 7 }}>{project}</div>
              : (
                <Sel
                  value={project}
                  onChange={(value) => {
                    setProject(value)
                    const selectedProject = projects.find((item) => item.name === value)
                    setTeam(selectedProject?.team ?? [])
                  }}
                  options={projects.map((item) => ({ value: item.name, label: item.name }))}
                />
              )}
          </Field>
          <Field label="Status" required>
            <Sel value={status} onChange={(value) => setStatus(value as SprintStatus)} options={sprintStatuses.map((value) => ({ value, label: value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Início" required error={errors.startDate}>
              <Inp type="date" value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="Fim" required error={errors.endDate}>
              <Inp type="date" value={endDate} onChange={setEndDate} />
            </Field>
          </div>
          <Field label="Objetivo da sprint">
            <Textarea value={goal} onChange={setGoal} placeholder="Descreva o que será entregue nesta sprint…" rows={4} />
          </Field>
        </div>

        <div>
          <Field label="Equipe da sprint">
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>
              {project ? `Membros do projeto "${project}"` : 'Selecione um projeto para filtrar membros'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {listMembers.map((m) => (
                <MemberPickerRow key={m.id} member={m} selected={team.includes(m.name)} onToggle={toggleMember} showWorkload />
              ))}
            </div>
            {team.length > 0 && (
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>
                {team.length} membro{team.length !== 1 ? 's' : ''} selecionado{team.length !== 1 ? 's' : ''}
              </div>
            )}
          </Field>
        </div>
      </div>
    </Modal>
  )
}
