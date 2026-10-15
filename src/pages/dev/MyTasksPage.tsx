import { useState, useMemo } from 'react'
import { c, STATUS_META } from '../../theme'
import TaskDetailModal from '../../modals/TaskDetailModal'
import type { Project, Task, TaskStatus, TaskType, TaskPriority } from '../../types'

// ── Type badge (SVG-based, no emoji) ─────────────────────────────────────────

const TYPE_META: Record<TaskType, { color: string; bg: string }> = {
  Melhoria: { color: '#E07B2A', bg: 'rgba(224,123,42,0.1)' },
  Bug:      { color: '#D95050', bg: 'rgba(217,80,80,0.1)' },
  Feature:  { color: '#4B7BF5', bg: 'rgba(75,123,245,0.1)' },
  Infra:    { color: '#7C5CDE', bg: 'rgba(124,92,222,0.1)' },
}

function TypeBadge({ type }: { type: TaskType }) {
  const m = TYPE_META[type]
  const icons: Record<TaskType, React.ReactNode> = {
    Melhoria: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 3l-2.5 2.5M3 13l2.5-2.5M9 5l2 2-6 6H3v-2l6-6z"/></svg>,
    Bug:      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="9" r="4"/><path d="M8 5V3M5 6.5L3 5M11 6.5l2-1.5M4 9H2M14 9h-2M5 12l-2 1.5M11 12l2 1.5"/></svg>,
    Feature:  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5z"/></svg>,
    Infra:    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="12" height="4" rx="1"/><rect x="2" y="10" width="12" height="4" rx="1"/><path d="M5 4h.01M5 12h.01"/></svg>,
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 7px', borderRadius: 4, backgroundColor: m.bg, color: m.color, fontWeight: 600 }}>
      {icons[type]}{type}
    </span>
  )
}

// ── Priority dot ──────────────────────────────────────────────────────────────

const PRI: Record<TaskPriority, { dot: string; label: string }> = {
  crítica: { dot: '#D95050', label: 'Crítica' },
  alta:    { dot: '#E07B2A', label: 'Alta' },
  média:   { dot: '#4B7BF5', label: 'Média' },
  baixa:   { dot: '#37A066', label: 'Baixa' },
}

// ── Status column config ──────────────────────────────────────────────────────

const STATUS_COLS: { status: TaskStatus; label: string }[] = [
  { status: 'Planejada',    label: 'Planejado' },
  { status: 'Em andamento', label: 'Em andamento' },
  { status: 'Bloqueada',    label: 'Bloqueada' },
  { status: 'Concluída',    label: 'Concluída' },
]

const PRIORITIES: TaskPriority[] = ['crítica', 'alta', 'média', 'baixa']
// ── Status selector (inline dropdown) ────────────────────────────────────────

function StatusSelector({ task, onUpdate }: { task: Task; onUpdate: (t: Task) => void }) {
  const [open, setOpen] = useState(false)
  const meta = STATUS_META[task.status]
  const statuses: TaskStatus[] = ['Planejada', 'Em andamento', 'Bloqueada', 'Concluída']

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: `1px solid ${meta.dot}33`, background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.dot, flexShrink: 0 }} />
        {meta.label}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>
      </button>
      {open && (
        <div
          style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 160 }}
          onClick={(e) => e.stopPropagation()}
        >
          {statuses.map((s) => {
            const sm = STATUS_META[s]
            return (
              <div
                key={s}
                onClick={() => { onUpdate({ ...task, status: s }); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, color: task.status === s ? '#4B7BF5' : c.textPrimary, fontWeight: task.status === s ? 600 : 400, backgroundColor: task.status === s ? 'rgba(75,123,245,0.05)' : 'transparent' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: sm.dot, flexShrink: 0 }} />
                {sm.label}
                {task.status === s && (
                  <svg style={{ marginLeft: 'auto' }} width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#4B7BF5" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ task, onUpdate, onOpen }: { task: Task; onUpdate: (t: Task) => void; onOpen: (t: Task) => void }) {
  const pri = PRI[task.priority]
  const isOver = (task.hoursSpent ?? 0) > task.estimatedHours

  return (
    <div
      onClick={() => onOpen(task)}
      style={{ backgroundColor: c.surface, border: `1px solid ${task.status === 'Bloqueada' ? 'rgba(217,80,80,0.3)' : c.border}`, borderRadius: 9, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 9, cursor: 'pointer', transition: 'box-shadow 0.15s, background-color 0.3s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      {/* ID + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: c.textMuted }}>{task.id}</span>
        {task.taskType && <TypeBadge type={task.taskType} />}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, lineHeight: 1.4 }}>{task.title}</div>

      {/* Project */}
      <div style={{ fontSize: 11, color: c.textMuted }}>{task.project}</div>

      {/* Priority + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: pri.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: c.textSecondary }}>{pri.label}</span>
        {task.daysDelayed > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4, backgroundColor: 'rgba(217,80,80,0.1)', color: '#D95050', fontWeight: 600 }}>Atrasada</span>
        )}
        {isOver && !task.daysDelayed && (
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4, backgroundColor: 'rgba(224,123,42,0.1)', color: '#E07B2A', fontWeight: 600 }}>Estourou</span>
        )}
      </div>

      {/* Progress bar (Em andamento only) */}
      {task.status === 'Em andamento' && task.progress !== undefined && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3, fontSize: 10, color: c.textMuted }}>{task.progress}%</div>
          <div style={{ height: 3, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${task.progress}%`, borderRadius: 2, backgroundColor: task.progress < 40 ? '#D95050' : '#4B7BF5' }} />
          </div>
        </div>
      )}

      {/* Blocker note */}
      {task.blockedBy && (
        <div style={{ fontSize: 11, color: '#D95050', backgroundColor: 'rgba(217,80,80,0.06)', border: '1px solid rgba(217,80,80,0.15)', padding: '5px 8px', borderRadius: 5, lineHeight: 1.35 }}>
          {task.blockedBy.slice(0, 70)}{task.blockedBy.length > 70 ? '…' : ''}
        </div>
      )}

      {/* Date + hours */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: c.textMuted }}>
        <span>{task.plannedEnd.split('-').slice(1).join('/')}/{task.plannedEnd.slice(2, 4)}</span>
        <span style={{ color: isOver ? '#E07B2A' : c.textMuted }}>{task.hoursSpent ?? 0}h / {task.estimatedHours}h</span>
      </div>

      {/* Status selector */}
      <div onClick={(e) => e.stopPropagation()}>
        <StatusSelector task={task} onUpdate={onUpdate} />
      </div>
    </div>
  )
}

// ── List row ──────────────────────────────────────────────────────────────────

function ListRow({ task, onUpdate, onOpen }: { task: Task; onUpdate: (t: Task) => void; onOpen: (t: Task) => void }) {
  const pri = PRI[task.priority]
  const isOver = (task.hoursSpent ?? 0) > task.estimatedHours

  return (
    <tr
      onClick={() => onOpen(task)}
      style={{ borderBottom: `1px solid ${c.border}`, cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = c.bg)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: c.textMuted, whiteSpace: 'nowrap' }}>{task.id}</td>
      <td style={{ padding: '10px 14px', minWidth: 220 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>{task.title}</div>
        {task.blockedBy && <div style={{ fontSize: 11, color: '#D95050', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 12v.01" strokeLinecap="round"/></svg>{task.blockedBy.slice(0, 60)}</div>}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: c.textSecondary, whiteSpace: 'nowrap' }}>{task.project}</td>
      <td style={{ padding: '10px 14px' }}>
        {task.taskType && <TypeBadge type={task.taskType} />}
      </td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: pri.dot }} />
          <span style={{ fontSize: 12, color: c.textSecondary }}>{pri.label}</span>
        </div>
      </td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: task.daysDelayed > 0 ? '#D95050' : c.textMuted, whiteSpace: 'nowrap' }}>{task.plannedEnd.split('-').reverse().join('/')}</td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: isOver ? '#E07B2A' : c.textMuted, whiteSpace: 'nowrap' }}>
        {task.hoursSpent ?? 0}h / {task.estimatedHours}h
      </td>
      <td style={{ padding: '10px 14px' }}>
        {task.status === 'Em andamento' && task.progress !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 56, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${task.progress}%`, borderRadius: 2, backgroundColor: '#4B7BF5' }} />
            </div>
            <span style={{ fontSize: 11, color: c.textMuted }}>{task.progress}%</span>
          </div>
        )}
        {task.daysDelayed > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, backgroundColor: 'rgba(217,80,80,0.1)', color: '#D95050', fontWeight: 600 }}>Atrasada</span>}
        {isOver && task.status === 'Concluída' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, backgroundColor: 'rgba(224,123,42,0.1)', color: '#E07B2A', fontWeight: 600 }}>Estourou</span>}
      </td>
      <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
        <StatusSelector task={task} onUpdate={onUpdate} />
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  tasks: Task[]
  projects: Project[]
  onUpdateTask: (task: Task) => Promise<void>
}

export default function MyTasksPage({ tasks, projects, onUpdateTask }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  async function updateTask(updated: Task) {
    await onUpdateTask(updated)
    setDetailTask(null)
  }

  const filtered = useMemo(() => tasks.filter((t) => {
    if (filterStatus !== 'Todos' && t.status !== filterStatus) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterProject && t.project !== filterProject) return false
    return true
  }), [tasks, filterStatus, search, filterPriority, filterProject])

  const counts = useMemo(() => {
    const r: Record<string, number> = { Todos: tasks.length }
    STATUS_COLS.forEach(({ status }) => { r[status] = tasks.filter((t) => t.status === status).length })
    return r
  }, [tasks])

  const filterPills = ['Todos', 'Planejada', 'Em andamento', 'Bloqueada', 'Concluída']
  const inProgress = tasks.filter((t) => t.status === 'Em andamento').length

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: c.textPrimary }}>Minhas Tarefas</div>
        <div style={{ fontSize: 13, color: c.textMuted, marginTop: 3 }}>{tasks.length} tarefas no total · {inProgress} em andamento</div>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {filterPills.map((s) => {
          const active = filterStatus === s
          const dot = s !== 'Todos' ? STATUS_META[s as TaskStatus]?.dot : undefined
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 20, border: `1px solid ${active ? '#4B7BF5' : c.border}`, background: active ? '#4B7BF5' : 'transparent', color: active ? '#fff' : c.textSecondary, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer' }}
            >
              {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, display: 'inline-block' }} />}
              {s === 'Planejada' ? 'Planejado' : s} {counts[s] ?? 0}
            </button>
          )
        })}
      </div>

      {/* Filters + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3 3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa ou ID..." style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 7, border: `1px solid ${c.border}`, background: c.surface, color: c.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, background: c.surface, color: filterPriority ? c.textPrimary : c.textMuted, fontSize: 13, cursor: 'pointer' }}>
          <option value="">Prioridade</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRI[p].label}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, background: c.surface, color: filterProject ? c.textPrimary : c.textMuted, fontSize: 13, cursor: 'pointer' }}>
          <option value="">Projeto</option>
          {projects.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}
        </select>
        {(search || filterPriority || filterProject) && (
          <button onClick={() => { setSearch(''); setFilterPriority(''); setFilterProject('') }} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, background: 'transparent', color: c.textMuted, fontSize: 12, cursor: 'pointer' }}>Limpar</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1px solid ${c.border}` }}>
          <button onClick={() => setView('kanban')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', background: view === 'kanban' ? '#4B7BF5' : 'transparent', color: view === 'kanban' ? '#fff' : c.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: view === 'kanban' ? 600 : 400 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="5" height="14" rx="1"/><rect x="8" y="1" width="5" height="14" rx="1"/></svg> Kanban
          </button>
          <button onClick={() => setView('lista')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', background: view === 'lista' ? '#4B7BF5' : 'transparent', color: view === 'lista' ? '#fff' : c.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: view === 'lista' ? 600 : 400 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h12M2 8h12M2 12h12"/></svg> Lista
          </button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flex: 1 }}>
          {STATUS_COLS.map(({ status, label }) => {
            const meta = STATUS_META[status]
            const colTasks = filtered.filter((t) => t.status === status)
            return (
              <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: meta.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.textPrimary }}>{label}</span>
                  <span style={{ marginLeft: 'auto', minWidth: 22, height: 20, borderRadius: 5, backgroundColor: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.map((t) => <KanbanCard key={t.id} task={t} onUpdate={updateTask} onOpen={setDetailTask} />)}
                  {colTasks.length === 0 && <div style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', paddingTop: 20, opacity: 0.5 }}>Sem tarefas</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista */}
      {view === 'lista' && (
        <div style={{ backgroundColor: c.surface, borderRadius: 10, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                {['ID', 'Título', 'Projeto', 'Tipo', 'Prioridade', 'Prazo', 'Horas', 'Progresso', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: c.textMuted, textAlign: 'left', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Nenhuma tarefa encontrada.</td></tr>}
              {filtered.map((t) => <ListRow key={t.id} task={t} onUpdate={updateTask} onOpen={setDetailTask} />)}
            </tbody>
          </table>
        </div>
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          readOnly
          onClose={() => setDetailTask(null)}
          onSave={updateTask}
        />
      )}
    </div>
  )
}
