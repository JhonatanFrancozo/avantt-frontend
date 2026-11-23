
import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Sel, Textarea } from '../components/form'
import { inputStyle } from '../components/form'
import { Badge, BtnPrimary, PriorityDot, TagPill } from '../components/atoms'
import MemberPickerRow from '../components/MemberPickerRow'
import { c, STATUS_META, STATUS_OPTIONS } from '../theme'
import { mkInitials } from '../utils'
import type {
  Task,
  Project,
  Member,
  Sprint,
  TaskPriority,
  TaskStatus,
} from '../types'
import * as api from '../api'
import type { CatalogItem } from '../api/catalogos'

interface Props {
  projects: Project[]
  tasks: Task[]
  members: Member[]
  sprints: Sprint[]
  onClose: () => void
  onSave: (t: Omit<Task, 'id'>) => void
}

function toNumericId(id?: string): number | undefined {
  if (!id) return undefined

  const parsed = Number(id)

  return Number.isFinite(parsed) ? parsed : undefined
}

export default function CreateTaskModal({
  projects,
  tasks: _tasks,
  members,
  sprints,
  onClose,
  onSave,
}: Props) {
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
  const [tagIds, setTagIds] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [statusCatalog, setStatusCatalog] = useState<CatalogItem[]>([])
  const [priorityCatalog, setPriorityCatalog] = useState<CatalogItem[]>([])
  const [tagCatalog, setTagCatalog] = useState<CatalogItem[]>([])

  useEffect(() => {
    Promise.all([
      api.catalogos.listarStatus(),
      api.catalogos.listarPrioridades(),
      api.catalogos.listarTags(),
    ])
      .then(([availableStatus, availablePriorities, availableTags]) => {
        setStatusCatalog(availableStatus)
        setPriorityCatalog(availablePriorities)
        setTagCatalog(availableTags)
      })
      .catch(() => {
        setStatusCatalog([])
        setPriorityCatalog([])
        setTagCatalog([])
      })
  }, [])

  const selectedProject = useMemo(
    () => projects.find((item) => item.name === project),
    [projects, project],
  )

  const sprintOptions = useMemo(
    () => sprints.filter((item) => !project || item.project === project),
    [project, sprints],
  )

  const filteredMembers = useMemo(() => {
    if (!selectedProject) return members

    const selectedProjectId = String(selectedProject.id)
    const selectedProjectName = selectedProject.name

    return members.filter((member) => {
      const memberProjectIds = member.projectIds ?? []
      const memberProjects = member.projects ?? []

      const hasProjectInformation =
        memberProjectIds.length > 0 || memberProjects.length > 0

      // Se a API não informou os projetos do membro,
      // mantém o membro disponível para seleção.
      if (!hasProjectInformation) return true

      return (
        memberProjectIds.includes(selectedProjectId) ||
        memberProjects.includes(selectedProjectId) ||
        memberProjects.includes(selectedProjectName)
      )
    })
  }, [members, selectedProject])

  function validate() {
    const e: Record<string, string> = {}

    if (!title.trim()) e.title = 'Título obrigatório'
    if (!project) e.project = 'Projeto obrigatório'
    if (!assignee) e.assignee = 'Responsável obrigatório'
    if (!plannedEnd) e.plannedEnd = 'Data obrigatória'

    setErrors(e)

    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return

    const selectedMember = members.find(
      (member) => member.name === assignee,
    )

    const selectedSprint = sprints.find(
      (item) => item.name === sprint,
    )

    const selectedStatus = statusCatalog.find(
      (item) =>
        item.nome.toLocaleLowerCase('pt-BR') === status,
    )

    const selectedPriority = priorityCatalog.find(
      (item) =>
        item.nome.toLocaleLowerCase('pt-BR') === priority,
    )

    const statusIds: Partial<Record<TaskStatus, number>> = {
      planejada: 1,
      'em andamento': 2,
      concluída: 3,
      bloqueada: 4,
    }

    onSave({
      title: title.trim(),

      project,
      projectId: toNumericId(selectedProject?.id),

      sprint: sprint.trim(),
      sprintId: selectedSprint?.id,

      assignee,
      assigneeId: toNumericId(selectedMember?.id),

      avatar: selectedMember?.avatar ?? mkInitials(assignee),
      avatarColor: selectedMember?.color ?? '#4B7BF5',

      priority,
      priorityId: selectedPriority?.id,

      status,
      statusId: selectedStatus?.id ?? statusIds[status],

      daysDelayed: 0,
      plannedEnd,
      estimatedHours: parseFloat(estimatedHours) || 0,
      blockedBy: blockedBy.trim() || null,

      tags,
      tagIds,
    })
  }

  async function addTag() {
    const tag = tagInput.trim().toLowerCase()

    if (!tag || tags.includes(tag)) return

    try {
      const catalogTag =
        tagCatalog.find(
          (item) => item.nome.toLowerCase() === tag,
        ) ?? await api.catalogos.criarTag(tag)

      setTagCatalog((current) =>
        current.some((item) => item.id === catalogTag.id)
          ? current
          : [...current, catalogTag],
      )

      setTags((current) => [...current, catalogTag.nome.toLowerCase()])
      setTagIds((current) => [...current, catalogTag.id])
      setTagInput('')

      setErrors((current) => {
        const next = { ...current }
        delete next.tag
        return next
      })
    } catch {
      setErrors((current) => ({
        ...current,
        tag: 'Não foi possível criar a tag',
      }))
    }
  }

  return (
    <Modal
      title="Nova Tarefa"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Criar Tarefa"
      wide
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Field label="Título" required error={errors.title}>
            <Inp
              value={title}
              onChange={setTitle}
              placeholder="Ex: Implementar endpoint de autenticação"
            />
          </Field>

          <Field label="Projeto" required error={errors.project}>
            <Sel
              value={project}
              onChange={(value) => {
                setProject(value)
                setSprint('')
                setAssignee('')
              }}
              options={projects.map((item) => ({
                value: item.name,
                label: item.name,
              }))}
            />
          </Field>

          <Field label="Sprint" error={errors.sprint}>
            <Sel
              value={sprint}
              onChange={setSprint}
              options={sprintOptions.map((item) => ({
                value: item.name,
                label: item.name,
              }))}
            />
          </Field>

          <Field
            label="Responsável"
            required
            error={errors.assignee}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                maxHeight: 180,
                overflowY: 'auto',
              }}
            >
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <MemberPickerRow
                    key={member.id}
                    member={member}
                    selected={assignee === member.name}
                    onToggle={(name) => {
                      setAssignee(name)
                      setErrors((current) => {
                        const next = { ...current }
                        delete next.assignee
                        return next
                      })
                    }}
                    showWorkload={false}
                  />
                ))
              ) : (
                <span
                  style={{
                    color: c.textMuted,
                    fontSize: 12,
                    padding: 8,
                  }}
                >
                  Nenhum responsável encontrado para este projeto.
                </span>
              )}
            </div>
          </Field>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <Field label="Prioridade">
              <Sel
                value={priority}
                onChange={(value) =>
                  setPriority(value as TaskPriority)
                }
                options={(
                  priorityCatalog.length
                    ? priorityCatalog
                    : [
                        { id: 1, nome: 'Baixa' },
                        { id: 2, nome: 'Média' },
                        { id: 3, nome: 'Alta' },
                      ]
                ).map((item) => ({
                  value: item.nome.toLocaleLowerCase(
                    'pt-BR',
                  ) as TaskPriority,
                  label: item.nome,
                }))}
              />
            </Field>

            <Field label="Status">
              <Sel
                value={status}
                onChange={(value) =>
                  setStatus(value as TaskStatus)
                }
                options={(
                  statusCatalog.length
                    ? statusCatalog
                        .map((item) => item.nome.toLocaleLowerCase('pt-BR'))
                        .filter(
                          (name): name is TaskStatus =>
                            STATUS_OPTIONS.includes(name as TaskStatus),
                        )
                    : STATUS_OPTIONS
                ).map((availableStatus) => ({
                  value: availableStatus,
                  label:
                    STATUS_META[availableStatus]?.label ??
                    availableStatus,
                }))}
              />
            </Field>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <Field
              label="Entrega"
              required
              error={errors.plannedEnd}
            >
              <Inp
                type="date"
                value={plannedEnd}
                onChange={setPlannedEnd}
              />
            </Field>

            <Field label="Horas est.">
              <Inp
                value={estimatedHours}
                onChange={setEstimatedHours}
                placeholder="Ex: 8"
              />
            </Field>
          </div>

          <Field label="Bloqueado por">
            <Textarea
              value={blockedBy}
              onChange={setBlockedBy}
              placeholder="Motivo do bloqueio, se houver…"
              rows={2}
            />
          </Field>

          <Field label="Tags" error={errors.tag}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void addTag()
                  }
                }}
                placeholder="backend, QA… Enter"
                style={{
                  ...inputStyle,
                  flex: 1,
                }}
              />

              <button
                type="button"
                onClick={() => void addTag()}
                style={{
                  padding: '8px 12px',
                  borderRadius: 7,
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.bg,
                  color: c.textSecondary,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                +
              </button>
            </div>

            {tags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  flexWrap: 'wrap',
                  marginTop: 6,
                }}
              >
                {tags.map((tag) => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    onRemove={() => {
                      const catalogTag = tagCatalog.find(
                        (item) =>
                          item.nome.toLowerCase() === tag,
                      )

                      setTags((current) =>
                        current.filter((item) => item !== tag),
                      )

                      if (catalogTag) {
                        setTagIds((current) =>
                          current.filter(
                            (id) => id !== catalogTag.id,
                          ),
                        )
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {tagCatalog.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagCatalog
                  .filter(
                    (item) =>
                      !tags.includes(item.nome.toLowerCase()),
                  )
                  .map((item) => (
                    <BtnPrimary
                      key={item.id}
                      variant="secondary"
                      compact
                      onClick={() => {
                        setTags((current) => [
                          ...current,
                          item.nome.toLowerCase(),
                        ])
                        setTagIds((current) => [
                          ...current,
                          item.id,
                        ])
                      }}
                    >
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium">
                        {item.nome}
                      </span>
                    </BtnPrimary>
                  ))}
              </div>
            )}
          </Field>

          {title && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: c.bg,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                transition: 'background-color 0.3s',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Pré-visualização
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: c.textPrimary,
                  marginBottom: 6,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {selectedProject && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 4,
                      backgroundColor:
                        selectedProject.color + '22',
                      color: selectedProject.color,
                      fontWeight: 500,
                    }}
                  >
                    {project}
                  </span>
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
