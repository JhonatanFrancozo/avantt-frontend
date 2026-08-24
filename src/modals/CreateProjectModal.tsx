import { useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Textarea, ColorPicker } from '../components/form'
import { inputStyle } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import { fmtDateShort } from '../utils'
import { PROJ_PALETTE } from '../constants'
import type { Project, Member } from '../types'

interface Props {
  members: Member[]
  onClose: () => void
  onSave: (p: Omit<Project, 'id'>) => void
}

export default function CreateProjectModal({ members, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJ_PALETTE[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [team, setTeam] = useState<string[]>([])
  const [risk, setRisk] = useState('')
  const [risks, setRisks] = useState<string[]>([])
  const [milestone, setMilestone] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [milestones, setMilestones] = useState<{ name: string; date: string; done: boolean }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!startDate) e.startDate = 'Data de início obrigatória'
    if (!endDate) e.endDate = 'Data de fim obrigatória'
    if (startDate && endDate && startDate >= endDate) e.endDate = 'Data de fim deve ser após início'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    onSave({ name: name.trim(), description: description.trim(), color, status: 'em andamento', startDate, endDate, progress: 0, sprints: { total: 0, done: 0, active: 0, delayed: 0 }, tasks: { total: 0, done: 0, delayed: 0, blocked: 0, cancelled: 0 }, team, risks, milestones })
  }

  function toggleMember(memberName: string) {
    setTeam((t) => t.includes(memberName) ? t.filter((x) => x !== memberName) : [...t, memberName])
  }

  function addRisk() {
    if (risk.trim()) { setRisks((r) => [...r, risk.trim()]); setRisk('') }
  }

  function addMilestone() {
    if (milestone.trim() && milestoneDate) {
      setMilestones((m) => [...m, { name: milestone.trim(), date: milestoneDate, done: false }])
      setMilestone(''); setMilestoneDate('')
    }
  }

  return (
    <Modal title="Novo Projeto" onClose={onClose} onSubmit={submit} submitLabel="Criar Projeto" wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome do projeto" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: App Mobile v2" />
          </Field>
          <Field label="Descrição">
            <Textarea value={description} onChange={setDescription} placeholder="Objetivo do projeto…" />
          </Field>
          <Field label="Cor">
            <ColorPicker colors={PROJ_PALETTE} value={color} onChange={setColor} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Início" required error={errors.startDate}>
              <Inp type="date" value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="Entrega" required error={errors.endDate}>
              <Inp type="date" value={endDate} onChange={setEndDate} />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Equipe">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 170, overflowY: 'auto' }}>
              {members.map((m) => (
                <MemberPickerRow key={m.id} member={m} selected={team.includes(m.name)} onToggle={toggleMember} showWorkload={false} />
              ))}
            </div>
          </Field>

          <Field label="Riscos">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={risk} onChange={(e) => setRisk(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRisk() } }} placeholder="Descreva um risco…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addRisk} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textSecondary, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+</button>
            </div>
            {risks.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', backgroundColor: c.amberLight, borderRadius: 6, borderLeft: `3px solid ${c.amber}`, fontSize: 12, color: c.textPrimary, marginTop: 4, transition: 'background-color 0.3s' }}>
                <span style={{ color: c.amber }}>⚠</span>
                <span style={{ flex: 1 }}>{r}</span>
                <button onClick={() => setRisks((rs) => rs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>✕</button>
              </div>
            ))}
          </Field>

          <Field label="Marcos">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="Nome do marco" style={{ ...inputStyle, flex: 1 }} />
              <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} style={{ ...inputStyle, width: 130, flex: 'none' }} />
              <button onClick={addMilestone} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.textSecondary, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+</button>
            </div>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${c.border}`, fontSize: 12, color: c.textPrimary, marginTop: 4 }}>
                <span style={{ color: c.blue }}>◎</span>
                <span style={{ flex: 1 }}>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: c.textMuted }}>{fmtDateShort(m.date)}</span>
                <button onClick={() => setMilestones((ms) => ms.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>✕</button>
              </div>
            ))}
          </Field>
        </div>
      </div>
    </Modal>
  )
}
