import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Textarea, ColorPicker, Sel } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { c } from '../theme'
import { maskDateInput, dateInputToIso, isoToDateInput } from '../utils'
import { PROJ_PALETTE } from '../constants'
import type { Project, Member, Client } from '../types'
import * as api from '../api'

interface Props {
  members: Member[]
  onClose: () => void
  onSave: (p: Omit<Project, 'id'>) => Promise<void>
  initial?: Project
}

export default function CreateProjectModal({ members, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [clientId, setClientId] = useState(initial?.clientId ? String(initial.clientId) : '')
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState('')
  const [color, setColor] = useState(initial?.color ?? PROJ_PALETTE[0])
  const [startDate, setStartDate] = useState(initial?.startDate ? isoToDateInput(initial.startDate) : '')
  const [endDate, setEndDate] = useState(initial?.endDate ? isoToDateInput(initial.endDate) : '')
  const [team, setTeam] = useState<string[]>(initial?.team ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    let active = true
    api.clientes.listarClientes()
      .then((items) => { if (active) setClients(items) })
      .catch((error: unknown) => { if (active) setClientsError(api.getApiErrorMessage(error)) })
      .finally(() => { if (active) setClientsLoading(false) })
    return () => { active = false }
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!startDate) e.startDate = 'Data de início obrigatória'
    if (!endDate) e.endDate = 'Data de fim obrigatória'
    const startIso = dateInputToIso(startDate)
    const endIso = dateInputToIso(endDate)
    if (startDate && !startIso) e.startDate = 'Use o formato DD/MM/AAAA'
    if (endDate && !endIso) e.endDate = 'Use o formato DD/MM/AAAA'
    if (startIso && endIso && startIso >= endIso) e.endDate = 'Data de fim deve ser após início'
    if (startDate && endDate) {
      const days = startIso && endIso
        ? Math.ceil((new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000)
        : 0
      if (days < 15) e.endDate = 'O projeto deve ter duração mínima de 15 dias'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    const client = clients.find((item) => String(item.id) === clientId)
    setSaving(true)
    setServerError('')
    try {
      await onSave({
        ...initial,
        name: name.trim(),
        description: description.trim(),
        clientId: client?.id ?? (clientId ? Number(clientId) : null),
        clientName: client?.name ?? (clientId === String(initial?.clientId ?? '') ? initial?.clientName : undefined),
        color,
        status: initial?.status ?? 'Em andamento',
        startDate: dateInputToIso(startDate),
        endDate: dateInputToIso(endDate),
        progress: initial?.progress ?? 0,
        sprints: initial?.sprints ?? { total: 0, done: 0, active: 0, delayed: 0 },
        tasks: initial?.tasks ?? { total: 0, done: 0, delayed: 0, blocked: 0, cancelled: 0 },
        team,
        teamIds: members.filter((member) => team.includes(member.name)).map((member) => Number(member.id.replace(/\D/g, ''))),
        risks: initial?.risks ?? [],
        milestones: initial?.milestones ?? [],
      })
    } catch (error: unknown) {
      setServerError(api.getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function toggleMember(memberName: string) {
    setTeam((t) => t.includes(memberName) ? t.filter((x) => x !== memberName) : [...t, memberName])
  }

  return (
    <Modal title={initial ? 'Editar Projeto' : 'Novo Projeto'} onClose={onClose} onSubmit={submit} submitLabel={saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Criar Projeto'} wide>
      {serverError && <div role="alert" style={{ marginBottom: 12, padding: '10px 12px', backgroundColor: c.redLight, color: c.red, borderRadius: 8, fontSize: 13 }}>{serverError}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome do projeto" required error={errors.name}>
            <Inp value={name} onChange={setName} placeholder="Ex: App Mobile v2" />
          </Field>
          <Field label="Descrição">
            <Textarea value={description} onChange={setDescription} placeholder="Objetivo do projeto…" />
          </Field>
          <Field label="Cliente">
            {clientsError
              ? <div role="alert" style={{ color: c.red, fontSize: 12 }}>{clientsError}</div>
              : clientsLoading
                ? <div style={{ fontSize: 12, color: c.textMuted }}>Carregando clientes...</div>
                : <Sel
                  value={clientId}
                  onChange={setClientId}
                  options={clients.map((client) => ({ value: String(client.id), label: client.name }))}
                />}
          </Field>
          <Field label="Cor">
            <ColorPicker colors={PROJ_PALETTE} value={color} onChange={setColor} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Início" required error={errors.startDate}>
              <Inp value={startDate} onChange={(value) => setStartDate(maskDateInput(value))} placeholder="DD/MM/AAAA" inputMode="numeric" maxLength={10} />
            </Field>
            <Field label="Entrega" required error={errors.endDate}>
              <Inp value={endDate} onChange={(value) => setEndDate(maskDateInput(value))} placeholder="DD/MM/AAAA" inputMode="numeric" maxLength={10} />
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

        </div>
      </div>
    </Modal>
  )
}
