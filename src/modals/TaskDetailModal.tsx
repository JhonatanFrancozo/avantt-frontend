
import { useState, type CSSProperties } from 'react'
import { c, STATUS_META, STATUS_OPTIONS } from '../theme'
import type { Task, TaskStatus, TaskPriority } from '../types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  crítica: '#D95050',
  alta: '#E07B2A',
  média: '#4B7BF5',
  baixa: '#37A066',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  crítica: 'Crítica',
  alta: 'Alta',
  média: 'Média',
  baixa: 'Baixa',
}

interface Props {
  task: Task
  readOnly?: boolean
  onClose: () => void
  onSave?: (updated: Task) => void | Promise<void>
  onSaveStatus?: (updated: Task) => void | Promise<void>
}

function normalizeStatus(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getStatusKey(status: unknown): TaskStatus | undefined {
  const normalized = normalizeStatus(status)

  return STATUS_OPTIONS.find(
    (option) => normalizeStatus(option) === normalized
  )
}

function StatusDot({ status }: { status: TaskStatus }) {
  const statusKey = getStatusKey(status)
  const meta = statusKey ? STATUS_META[statusKey] : undefined

  const fallback = {
    bg: '#E5E7EB',
    text: '#374151',
    dot: '#6B7280',
    label: String(status || 'Sem status'),
  }

  const style = meta ?? fallback

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        backgroundColor: style.bg,
        color: style.text,
        fontSize: 12,
        fontWeight: 500,
        border: `1px solid ${style.dot}33`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: style.dot,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {style.label}
    </span>
  )
}

export default function TaskDetailModal({
  task: initial,
  readOnly = false,
  onClose,
  onSave,
  onSaveStatus,
}: Props) {
  const [task, setTask] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const inp: CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${c.border}`,
    backgroundColor: c.bg,
    color: c.textPrimary,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  async function save() {
    if (saving) return

    try {
      setSaving(true)

      await onSave?.(task)

      setEditing(false)
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)

      alert(
        'Não foi possível salvar a tarefa. Verifique sua conexão e tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveReadOnly() {
    if (saving) return

    if (!onSaveStatus) {
      console.error('A função onSaveStatus não foi informada ao modal.')
      alert('A atualização de status não está configurada.')
      return
    }

    try {
      setSaving(true)

      await onSaveStatus(task)

      onClose()
    } catch (error) {
      console.error('Erro ao salvar status da tarefa:', error)

      alert(
        'Não foi possível salvar o status da tarefa. Tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  const isOverEstimate =
    (task.hoursSpent ?? 0) > (task.estimatedHours ?? 0)

  const currentStatusKey = getStatusKey(task.status)

  const currentPriority = PRIORITY_LABELS[task.priority]
    ? task.priority
    : 'média'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: c.surface,
          borderRadius: 12,
          width: 580,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: c.textMuted,
                marginBottom: 6,
              }}
            >
              {task.id} · {task.sprint}
            </div>

            {editing && !readOnly ? (
              <input
                value={task.title}
                onChange={(event) =>
                  setTask((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                style={{ ...inp, fontSize: 15, fontWeight: 600 }}
              />
            ) : (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: c.textPrimary,
                  lineHeight: 1.4,
                }}
              >
                {task.title}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!readOnly && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${c.border}`,
                  background: 'transparent',
                  color: c.textSecondary,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
            )}

            <button
              onClick={onClose}
              disabled={saving}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: `1px solid ${c.border}`,
                background: 'transparent',
                color: c.textMuted,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Status + Priority */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Status
              </div>

              {editing && !readOnly ? (
                <select
                  value={currentStatusKey ?? ''}
                  onChange={(event) =>
                    setTask((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  style={inp}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}
                    </option>
                  ))}
                </select>
              ) : readOnly ? (
                <select
                  value={currentStatusKey ?? ''}
                  onChange={(event) =>
                    setTask((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {!currentStatusKey && (
                    <option value="">Status não identificado</option>
                  )}

                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusDot status={task.status} />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginBottom: 7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Prioridade
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: c.textSecondary,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: PRIORITY_COLORS[currentPriority],
                    display: 'inline-block',
                  }}
                />
                {PRIORITY_LABELS[currentPriority]}
              </span>
            </div>
          </div>

          {/* Project + Responsible */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Projeto
              </div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>
                {task.project || 'Não informado'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Responsável
              </div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>
                {task.assignee || 'Não atribuído'}
              </div>
            </div>
          </div>

          {/* Dates + Hours */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Prazo
              </div>
              <div style={{ fontSize: 13, color: task.daysDelayed > 0 ? '#D95050' : c.textSecondary }}>
                {task.plannedEnd
                  ? task.plannedEnd.split('-').reverse().join('/')
                  : 'Não informado'}
                {task.daysDelayed > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#D95050' }}>
                    +{task.daysDelayed}d
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hrs estimadas
              </div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>
                {task.estimatedHours ?? 0}h
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hrs realizadas
              </div>
              <div style={{ fontSize: 13, color: isOverEstimate ? '#E07B2A' : c.textSecondary }}>
                {task.hoursSpent ?? 0}h
                {isOverEstimate && (
                  <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 600, color: '#E07B2A' }}>
                    acima do estimado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Blocker */}
          {task.blockedBy && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bloqueio
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#D95050',
                  backgroundColor: 'rgba(217,80,80,0.06)',
                  border: '1px solid rgba(217,80,80,0.2)',
                  padding: '10px 12px',
                  borderRadius: 7,
                  lineHeight: 1.5,
                }}
              >
                {task.blockedBy}
              </div>
            </div>
          )}

          {/* Progress */}
          {currentStatusKey === 'em andamento' && task.progress !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Progresso
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>
                  {task.progress}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${task.progress}%`,
                    borderRadius: 3,
                    backgroundColor: task.progress < 40 ? '#D95050' : '#4B7BF5',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tags
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: '3px 9px',
                      borderRadius: 20,
                      backgroundColor: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.textSecondary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Descrição
              </div>
              <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>
                {task.description}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {readOnly && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: `1px solid ${c.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              onClick={saveReadOnly}
              disabled={saving}
              style={{
                padding: '7px 18px',
                borderRadius: 7,
                border: 'none',
                background: '#4B7BF5',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar status'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
