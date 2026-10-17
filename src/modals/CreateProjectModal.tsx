import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Textarea, ColorPicker, Sel } from '../components/form'
import { inputStyle } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import { fmtDateShort } from '../utils'
import { PROJ_PALETTE } from '../constants'
import type { Project, Member, Client } from '../types'
import * as api from '../api'

interface Props {
  members: Member[]
  onClose: () => void
  onSave: (p: Omit<Project, 'id'>) => void
  initial?: Project
}

export default function CreateProjectModal({ members, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [clientId, setClientId] = useState(initial?.clientId ? String(initial.clientId) : '')
  const [clients, setClients] = useState<Client[]>([])
  const [color, setColor] = useState(initial?.color ?? PROJ_PALETTE[0])
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [team, setTeam] = useState<string[]>(initial?.team ?? [])
  const [risk, setRisk] = useState('')
  const [risks, setRisks] = useState<string[]>([])
  const [milestone, setMilestone] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [milestones, setMilestones] = useState<{ name: string; date: string; done: boolean }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api.clientes.listarClientes().then(setClients).catch(() => setClients([]))
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!startDate) e.startDate = 'Data de início obrigatória'
    if (!endDate) e.endDate = 'Data de fim obrigatória'
    if (startDate && endDate && startDate >= endDate) e.endDate = 'Data de fim deve ser após início'
    if (startDate && endDate) {
      const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
      if (days < 15) e.endDate = 'O projeto deve ter duração mínima de 15 dias'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit() {
    if (!validate()) return
    const client = clients.find((item) => String(item.id) === clientId)
    onSave({ name: name.trim(), description: description.trim(), clientId: client?.id ?? null, clientName: client?.name, color, status: 'Em andamento', startDate, endDate, progress: 0, sprints: { total: 0, done: 0, active: 0, delayed: 0 }, tasks: { total: 0, done: 0, delayed: 0, blocked: 0, cancelled: 0 }, team, teamIds: members.filter((member) => team.includes(member.name)).map((member) => Number(member.id.replace(/\D/g, ''))), risks, milestones })
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
    <Modal title={initial ? 'Editar Projeto' : 'Novo Projeto'} onClose={onClose} onSubmit={submit} submitLabel={initial ? 'Salvar alterações' : 'Criar Projeto'} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome do projeto" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: App Mobile v2" />
          </Field>
          <Field label="Descrição">
            <Textarea value={description} onChange={setDescription} placeholder="Objetivo do projeto…" />
          </Field>
          <Field label="Cliente">
            <Sel
              value={clientId}
              onChange={setClientId}
              options={clients.map((client) => ({ value: String(client.id), label: client.name }))}
            />
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
