import { useState, useMemo } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, Textarea } from '../components/form'
import { inputStyle } from '../components/form'
import { Badge, PriorityDot, TagPill } from '../components/atoms'
import MemberPickerRow from '../components/MemberPickerRow'
import { c, STATUS_META, STATUS_OPTIONS } from '../core/theme'
import { mkInitials, nextTaskId } from '../core/utils'
import type { Task, Project, Member, TaskPriority, TaskStatus } from '../core/types'

interface Props {
  projects: Project[]
  tasks: Task[]
  members: Member[]
  onClose: () => void
  onSave: (t: Omit<Task, 'id'>) => void
}

export default function CreateTaskModal({ projects, tasks, members, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [sprint, setSprint] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('média')
  const [status, setStatus] = useState<TaskStatus>('planejada')
  const [plannedEnd, setPlannedEnd] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [blockedBy, setBlockedBy] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sprintOptions = useMemo(() => [...new Set(tasks.map((t) => t.sprint))].sort(), [tasks])
  const filteredMembers = useMemo(
    () => (project ? members.filter((m) => m.projects.includes(project)) : members),
    [project, members],
  )

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Título obrigatório'
    if (!project) e.project = 'Projeto obrigatório'
    if (!sprint.trim()) e.sprint = 'Sprint obrigatória'
    if (!assignee) e.assignee = 'Responsável obrigatório'
    if (!plannedEnd) e.plannedEnd = 'Data obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    const m = members.find((x) => x.name === assignee)
    onSave({ title: title.trim(), project, sprint: sprint.trim(), assignee, avatar: m?.avatar ?? mkInitials(assignee), avatarColor: m?.color ?? '#4B7BF5', priority, status, daysDelayed: 0, plannedEnd, estimatedHours: parseFloat(estimatedHours) || 0, blockedBy: blockedBy.trim() || null, tags })
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) { setTags((ts) => [...ts, t]); setTagInput('') }
  }

  const selectedProject = project ? projects.find((p) => p.name === project) : undefined

  return (
    <Modal title="Nova Tarefa" onClose={onClose} onSubmit={submit} submitLabel="Criar Tarefa" wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Título" required error={errors.title}>
            <Inp value={title} onChange={setTitle} placeholder="Ex: Implementar endpoint de autenticação" />
          </Field>
          <Field label="Projeto" required error={errors.project}>
            <Sel value={project} onChange={(v) => { setProject(v); setAssignee('') }} options={projects.map((p) => ({ value: p.name, label: p.name }))} />
          </Field>
          <Field label="Sprint" required error={errors.sprint}>
            <Sel value={sprint} onChange={setSprint} options={sprintOptions.map((s) => ({ value: s, label: s }))} />
            <Inp value={sprint} onChange={setSprint} placeholder="Ou digite: Sprint 15…" />
          </Field>
          <Field label="Responsável" required error={errors.assignee}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {filteredMembers.map((m) => (
                <MemberPickerRow key={m.id} member={m} selected={assignee === m.name} onToggle={(name) => setAssignee(name)} showWorkload={false} />
              ))}
            </div>
          </Field>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Prioridade">
              <Sel value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={[{ value: 'crítica', label: '🔴 Crítica' }, { value: 'alta', label: '🟠 Alta' }, { value: 'média', label: '🔵 Média' }, { value: 'baixa', label: '🟢 Baixa' }]} />
            </Field>
            <Field label="Status">
              <Sel value={status} onChange={(v) => setStatus(v as TaskStatus)} options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Entrega" required error={errors.plannedEnd}>
              <Inp type="date" value={plannedEnd} onChange={setPlannedEnd} />
            </Field>
            <Field label="Horas est.">
              <Inp value={estimatedHours} onChange={setEstimatedHours} placeholder="Ex: 8" />
            </Field>
          </div>
          <Field label="Bloqueado por">
            <Textarea value={blockedBy} onChange={setBlockedBy} placeholder="Motivo do bloqueio, se houver…" rows={2} />
          </Field>
          <Field label="Tags">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder="backend, QA… Enter" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addTag} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textSecondary, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+</button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                {tags.map((tag) => <TagPill key={tag} tag={tag} onRemove={() => setTags((ts) => ts.filter((t) => t !== tag))} />)}
              </div>
            )}
          </Field>

          {title && (
            <div style={{ padding: '10px 12px', backgroundColor: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, transition: 'background-color 0.3s' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pré-visualização</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, marginBottom: 6 }}>{title}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedProject && (
                  <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, backgroundColor: selectedProject.color + '22', color: selectedProject.color, fontWeight: 500 }}>{project}</span>
                )}
                <Badge status={status} />
                <PriorityDot priority={priority} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}



