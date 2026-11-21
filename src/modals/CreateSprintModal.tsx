import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, Textarea } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import { getApiErrorMessage } from '../api'
import type { Sprint, SprintStatus, Project, Member } from '../types'
import { maskDateInput, dateInputToIso, isoToDateInput } from '../utils'

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
  const [startDate, setStartDate] = useState(initial?.startDate ? isoToDateInput(initial.startDate) : '')
  const [endDate, setEndDate] = useState(initial?.endDate ? isoToDateInput(initial.endDate) : '')
  const [goal, setGoal] = useState(initial?.goal ?? '')
  const [status, setStatus] = useState<SprintStatus>(initial?.status ?? 'Planejada')
  const [team, setTeam] = useState<string[]>(initial?.team ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  const listMembers = useMemo(
    () => (project ? members.filter((member) => member.projects.includes(project)) : members),
    [project, members],
  )

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'Nome obrigatório'
    if (!project) nextErrors.project = 'Projeto obrigatório'
    if (!startDate) nextErrors.startDate = 'Data de início obrigatória'
    if (!endDate) nextErrors.endDate = 'Data de fim obrigatória'
    const startIso = dateInputToIso(startDate)
    const endIso = dateInputToIso(endDate)
    if (startDate && !startIso) nextErrors.startDate = 'Use o formato DD/MM/AAAA'
    if (endDate && !endIso) nextErrors.endDate = 'Use o formato DD/MM/AAAA'
    if (startIso && endIso && startIso >= endIso) nextErrors.endDate = 'Data de fim deve ser após início'
    const periodChanged = !initial || startIso !== initial.startDate || endIso !== initial.endDate
    if (periodChanged && startIso && endIso && (new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000 < 15) {
      nextErrors.endDate = 'A sprint deve ter duração mínima de 15 dias'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
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
        startDate: dateInputToIso(startDate),
        endDate: dateInputToIso(endDate),
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
    setTeam((current) => current.includes(memberName)
      ? current.filter((name) => name !== memberName)
      : [...current, memberName])
  }

  return (
    <Modal title={initial ? 'Editar Sprint' : 'Nova Sprint'} onClose={onClose} onSubmit={submit} submitLabel={initial ? 'Salvar alterações' : 'Criar Sprint'} wide>
      {serverError && <div role="alert" style={{ marginBottom: 12, padding: '10px 12px', backgroundColor: c.redLight, color: c.red, borderRadius: 8, fontSize: 13 }}>{serverError}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome da sprint" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: Sprint 15" />
          </Field>
          <Field label="Projeto" required error={errors.project}>
            {initial
              ? <div style={{ padding: '9px 10px', color: c.textSecondary, backgroundColor: c.bg, borderRadius: 7 }}>{project}</div>
              : <Sel value={project} onChange={setProject} options={projects.map((item) => ({ value: item.name, label: item.name }))} />}
          </Field>
          <Field label="Status" required>
            <Sel value={status} onChange={(value) => setStatus(value as SprintStatus)} options={sprintStatuses.map((value) => ({ value, label: value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Início" required error={errors.startDate}>
              <Inp value={startDate} onChange={(value) => setStartDate(maskDateInput(value))} placeholder="DD/MM/AAAA" inputMode="numeric" maxLength={10} />
            </Field>
            <Field label="Fim" required error={errors.endDate}>
              <Inp value={endDate} onChange={(value) => setEndDate(maskDateInput(value))} placeholder="DD/MM/AAAA" inputMode="numeric" maxLength={10} />
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
              {listMembers.map((member) => (
                <MemberPickerRow key={member.id} member={member} selected={team.includes(member.name)} onToggle={toggleMember} showWorkload />
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
