import { useState, useMemo } from 'react'
import { c, STATUS_META, STATUS_OPTIONS, PRIORITY_META } from '../theme'
import { Avatar, Badge, PriorityDot, BtnPrimary, TagPill } from '../components/atoms'
import ProgressBar from '../components/atoms/ProgressBar'
import { fmtDateShort, delayColor } from '../utils'
import { PRIORITY_ORDER } from '../constants'
import type { Task, Project, Member, TaskStatus, TaskPriority } from '../types'

// ── Kanban ─────────────────────────────────────────────────────────────────────

function KanbanCard({ task, projColors }: { task: Task; projColors: Record<string, string> }) {
  const priMeta = PRIORITY_META[task.priority]
  return (
    <div style={{ backgroundColor: c.surface, border: `1px solid ${task.status === 'bloqueada' ? 'var(--color-red)44' : c.border}`, borderRadius: 9, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'default', transition: 'box-shadow 0.15s, background-color 0.3s', opacity: task.status === 'cancelada' ? 0.6 : 1 }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c.textMuted }}>{task.id}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: c.textSecondary }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priMeta.dot, flexShrink: 0 }} />{priMeta.label}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, lineHeight: 1.4, textDecoration: task.status === 'cancelada' ? 'line-through' : 'none' }}>{task.title}</div>
      {task.blockedBy && (
        <div style={{ fontSize: 11, color: c.red, display: 'flex', alignItems: 'flex-start', gap: 4, backgroundColor: c.redLight, padding: '5px 7px', borderRadius: 5, transition: 'background-color 0.3s' }}>
          <span style={{ flexShrink: 0 }}>⚠</span><span style={{ lineHeight: 1.35 }}>{task.blockedBy}</span>
        </div>
      )}
      {task.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {task.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar i={task.avatar} color={task.avatarColor} size={22} />
          <span style={{ fontSize: 11, color: c.textSecondary }}>{task.assignee.split(' ')[0]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.daysDelayed > 0 && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delayColor(task.daysDelayed) }}>+{task.daysDelayed}d</span>}
          <span style={{ fontSize: 10, color: c.textMuted, fontFamily: 'var(--font-mono)' }}>{fmtDateShort(task.plannedEnd)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: projColors[task.project] ?? '#9AA3B2', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project}</span>
      </div>
    </div>
  )
}

function KanbanBoard({ tasks, projColors }: { tasks: Task[]; projColors: Record<string, string> }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 8 }}>
      {STATUS_OPTIONS.map((status) => {
        const meta = STATUS_META[status]
        const colTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status} style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', backgroundColor: c.bg, borderRadius: 10, border: `1px solid ${c.border}`, overflow: 'hidden', transition: 'background-color 0.3s' }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.border}`, backgroundColor: c.surface, transition: 'background-color 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: meta.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: c.textPrimary }}>{meta.label}</span>
              </div>
              <span style={{ minWidth: 22, height: 22, borderRadius: 6, backgroundColor: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{colTasks.length}</span>
            </div>
            <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {colTasks.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: c.textMuted, fontSize: 12 }}>Nenhuma tarefa</div>}
              {colTasks.map((task) => <KanbanCard key={task.id} task={task} projColors={projColors} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Backlog page ───────────────────────────────────────────────────────────────

interface Props {
  tasks: Task[]
  projects: Project[]
  members: Member[]
  onCreateTask: () => void
}

export default function BacklogPage({ tasks, projects, members: _members, onCreateTask }: Props) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('')
  const [filterProject, setFilterProject] = useState('')
  const [filterSprint, setFilterSprint] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<'id' | 'daysDelayed' | 'plannedEnd' | 'priority'>('plannedEnd')
  const [sortDir, setSortDir] = useState<1 | -1>(1)

  const sprints = useMemo(() => [...new Set(tasks.map((t) => t.sprint))].sort(), [tasks])
  const assignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee))].sort(), [tasks])
  const projColors = useMemo(() => { const m: Record<string, string> = {}; projects.forEach((p) => { m[p.name] = p.color }); return m }, [projects])

  // Status counts — computed once, not once per status pill
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUS_OPTIONS.forEach((s) => { counts[s] = 0 })
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1 })
    return counts
  }, [tasks])

  const filtered = useMemo(() => {
    let r = tasks
    if (filterStatus) r = r.filter((t) => t.status === filterStatus)
    if (filterProject) r = r.filter((t) => t.project === filterProject)
    if (filterSprint) r = r.filter((t) => t.sprint === filterSprint)
    if (filterAssignee) r = r.filter((t) => t.assignee === filterAssignee)
    if (filterPriority) r = r.filter((t) => t.priority === filterPriority)
    if (search) { const q = search.toLowerCase(); r = r.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)) }
    return [...r].sort((a, b) => {
      let va: string | number = '', vb: string | number = ''
      if (sortCol === 'id') { va = a.id; vb = b.id }
      else if (sortCol === 'daysDelayed') { va = a.daysDelayed; vb = b.daysDelayed }
      else if (sortCol === 'plannedEnd') { va = a.plannedEnd; vb = b.plannedEnd }
      else { va = PRIORITY_ORDER[a.priority] ?? 9; vb = PRIORITY_ORDER[b.priority] ?? 9 }
      return va < vb ? -sortDir : va > vb ? sortDir : 0
    })
  }, [tasks, filterStatus, filterProject, filterSprint, filterAssignee, filterPriority, search, sortCol, sortDir])

  const hasFilters = !!(filterStatus || filterProject || filterSprint || filterAssignee || filterPriority || search)

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1))
    else { setSortCol(col); setSortDir(1) }
  }

  function SortIcon({ col }: { col: typeof sortCol }) {
    return <span style={{ color: sortCol === col ? c.blue : c.textMuted, marginLeft: 4 }}>{sortCol === col ? (sortDir === 1 ? '↑' : '↓') : '↕'}</span>
  }

  return (
    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((s) => {
            const meta = STATUS_META[s]; const active = filterStatus === s
            return (
              <button key={s} onClick={() => setFilterStatus(active ? '' : s)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? meta.text : c.border}`, backgroundColor: active ? meta.bg : c.surface, color: active ? meta.text : c.textSecondary, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: meta.dot, flexShrink: 0 }} />
                {meta.label}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11 }}>{statusCounts[s] ?? 0}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden', padding: 3, gap: 2 }}>
            {([{ key: 'list', icon: '≡', label: 'Lista' }, { key: 'kanban', icon: '⊞', label: 'Kanban' }] as const).map(({ key, icon, label }) => (
              <button key={key} onClick={() => setView(key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: view === key ? c.surface : 'transparent', color: view === key ? c.textPrimary : c.textMuted, fontSize: 13, fontWeight: view === key ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: view === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'background-color 0.15s' }}>
                <span style={{ fontSize: 14 }}>{icon}</span>{label}
              </button>
            ))}
          </div>
          <BtnPrimary onClick={onCreateTask}>＋ Nova Tarefa</BtnPrimary>
        </div>
      </div>

      <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', transition: 'background-color 0.3s' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Buscar</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, título ou responsável…" style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textPrimary, fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none', transition: 'background-color 0.3s' }} />
        </div>
        {[
          { label: 'Projeto', value: filterProject, options: projects.map((p) => p.name), set: setFilterProject },
          { label: 'Sprint', value: filterSprint, options: sprints, set: setFilterSprint },
          { label: 'Responsável', value: filterAssignee, options: assignees, set: setFilterAssignee },
          { label: 'Prioridade', value: filterPriority, options: ['crítica','alta','média','baixa'], set: (v: string) => setFilterPriority(v as TaskPriority | '') },
        ].map(({ label, value, options, set }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
            <select value={value} onChange={(e) => set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.surface, color: c.textPrimary, fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', minWidth: 130, outline: 'none', transition: 'background-color 0.3s' }}>
              <option value="">Todos</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ padding: '6px 12px', borderRadius: 7, backgroundColor: c.bg, border: `1px solid ${c.border}`, fontSize: 12, color: c.textMuted, transition: 'background-color 0.3s' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.textPrimary }}>{filtered.length}</span> tarefa{filtered.length !== 1 ? 's' : ''}
          </div>
          {hasFilters && (
            <button onClick={() => { setFilterStatus(''); setFilterProject(''); setFilterSprint(''); setFilterAssignee(''); setFilterPriority(''); setSearch('') }} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${c.red}`, backgroundColor: c.redLight, color: c.red, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Limpar</button>
          )}
        </div>
      </div>

      {view === 'kanban' && <KanbanBoard tasks={filtered} projColors={projColors} />}

      {view === 'list' && (
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden', flex: 1, transition: 'background-color 0.3s' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.bg }}>
                  {[
                    { label: 'ID', col: 'id' as const },
                    { label: 'Tarefa', col: null },
                    { label: 'Projeto', col: null },
                    { label: 'Sprint', col: null },
                    { label: 'Responsável', col: null },
                    { label: 'Prioridade', col: 'priority' as const },
                    { label: 'Status', col: null },
                    { label: 'Entrega', col: 'plannedEnd' as const },
                    { label: 'Horas', col: null },
                    { label: 'Atraso', col: 'daysDelayed' as const },
                  ].map(({ label, col }) => (
                    <th key={label} onClick={col ? () => toggleSort(col) : undefined} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap', cursor: col ? 'pointer' : 'default', userSelect: 'none' }}>
                      {label}{col && <SortIcon col={col} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Nenhuma tarefa encontrada com os filtros selecionados.</td></tr>
                )}
                {filtered.map((task, i) => {
                  const isCancelled = task.status === 'cancelada'
                  const isOverdue = task.daysDelayed > 0
                  return (
                    <tr key={task.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none', opacity: isCancelled ? 0.6 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = c.bg)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '11px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: c.textMuted, whiteSpace: 'nowrap' }}>{task.id}</td>
                      <td style={{ padding: '11px 14px', minWidth: 220 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, textDecoration: isCancelled ? 'line-through' : 'none' }}>{task.title}</div>
                        {task.blockedBy && <div style={{ fontSize: 11, color: c.red, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}><span>⚠</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{task.blockedBy}</span></div>}
                        {task.tags.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>{task.tags.map((tag) => <TagPill key={tag} tag={tag} />)}</div>}
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.textPrimary }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: projColors[task.project] ?? '#9AA3B2', flexShrink: 0 }} />{task.project}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: 12, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{task.sprint}</span></td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Avatar i={task.avatar} color={task.avatarColor} size={24} />
                          <span style={{ fontSize: 12, color: c.textPrimary }}>{task.assignee}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><PriorityDot priority={task.priority} /></td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><Badge status={task.status} /></td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: isOverdue ? c.red : c.textPrimary, fontWeight: isOverdue ? 600 : 400 }}>{fmtDateShort(task.plannedEnd)}</span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: c.textSecondary }}>{task.estimatedHours > 0 ? `${task.estimatedHours}h` : '—'}</span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {task.daysDelayed > 0
                          ? <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delayColor(task.daysDelayed) }}>+{task.daysDelayed}d</span>
                          : <span style={{ fontSize: 12, color: c.textMuted, fontFamily: 'var(--font-mono)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
