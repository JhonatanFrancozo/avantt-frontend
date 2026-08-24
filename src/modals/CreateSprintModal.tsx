import { useState, useMemo } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, Textarea } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import type { Sprint, Project, Member } from '../types'

interface Props {
  projects: Project[]
  members: Member[]
  onClose: () => void
  onSave: (s: Omit<Sprint, 'id'>) => void
}

export default function CreateSprintModal({ projects, members, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [project, setProject] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [goal, setGoal] = useState('')
  const [team, setTeam] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const listMembers = useMemo(
    () => (project ? members.filter((m) => m.projects.includes(project)) : members),
    [project, members],
  )

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!project) e.project = 'Projeto obrigatório'
    if (!startDate) e.startDate = 'Data de início obrigatória'
    if (!endDate) e.endDate = 'Data de fim obrigatória'
    if (startDate && endDate && startDate >= endDate) e.endDate = 'Data de fim deve ser após início'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    onSave({ name: name.trim(), project, startDate, endDate, daysDelayed: 0, progress: 0, totalTasks: 0, doneTasks: 0, blockedTasks: 0, team, goal: goal.trim() })
  }

  function toggleMember(memberName: string) {
    setTeam((t) => t.includes(memberName) ? t.filter((x) => x !== memberName) : [...t, memberName])
  }

  return (
    <Modal title="Nova Sprint" onClose={onClose} onSubmit={submit} submitLabel="Criar Sprint" wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome da sprint" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: Sprint 15" />
          </Field>
          <Field label="Projeto" required error={errors.project}>
            <Sel value={project} onChange={setProject} options={projects.map((p) => ({ value: p.name, label: p.name }))} />
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
