
import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { Field, Inp, Textarea, ColorPicker, Sel } from '../components/form'
import MemberPickerRow from '../components/MemberPickerRow'
import { PROJ_PALETTE } from '../constants'
import type { Project, Member, Client } from '../types'
import * as api from '../api'
import { getApiErrorDetails, getApiErrorMessage } from '../api'
import { c } from '../theme'
import { fmtDate, getLocalDateInputValue } from '../utils'

interface Props {
  members: Member[]
  onClose: () => void
  onSave: (p: Omit<Project, 'id'>) => Promise<void>
  initial?: Project
}

export default function CreateProjectModal({
  members,
  onClose,
  onSave,
  initial
}: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [clientId, setClientId] = useState(
    initial?.clientId ? String(initial.clientId) : ''
  )
  const [clients, setClients] = useState<Client[]>([])
  const [color, setColor] = useState(initial?.color ?? PROJ_PALETTE[0])
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [team, setTeam] = useState<string[]>(initial?.team ?? [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    api.clientes.listarClientes()
      .then(setClients)
      .catch(() => setClients([]))
  }, [])

  function validate() {
    const e: Record<string, string> = {}

    if (!name.trim()) {
      e.name = 'Nome obrigatório'
    }

    if (!startDate) {
      e.startDate = 'Data de início obrigatória'
    } else if (startDate < getLocalDateInputValue()) {
      e.startDate = 'Data de início deve ser hoje ou uma data futura'
    }

    if (!endDate) {
      e.endDate = 'Data de fim obrigatória'
    }

    if (startDate && endDate && startDate >= endDate) {
      e.endDate = 'Data de fim deve ser após início'
    }

    if (startDate && endDate) {
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
      )

      if (days < 15) {
        e.endDate = 'O projeto deve ter duração mínima de 15 dias'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setServerError('')
    if (!validate()) return

    const client = clients.find(
      (item) => String(item.id) === clientId
    )

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        clientId: client?.id ?? null,
        clientName: client?.name,
        color,
        status: initial?.status ?? 'Em andamento',
        startDate,
        endDate,
        progress: 0,
        sprints: {
          total: 0,
          done: 0,
          active: 0,
          delayed: 0
        },
        tasks: {
          total: 0,
          done: 0,
          delayed: 0,
          blocked: 0,
          cancelled: 0
        },
        team,
        teamIds: members
          .filter((member) => team.includes(member.name))
          .map((member) => Number(member.id.replace(/\D/g, ''))),
        risks: initial?.risks ?? [],
        milestones: initial?.milestones ?? []
      })
    } catch (error) {
      const details = getApiErrorDetails(error)
      const fieldNames = new Set(['name', 'startDate', 'endDate'])
      const fieldErrors: Record<string, string> = {}

      for (const detail of details) {
        if (detail.field && fieldNames.has(detail.field)) {
          fieldErrors[detail.field] = detail.message
        }
      }

      setErrors(fieldErrors)
      if (details.length === 0 || details.some((detail) => !detail.field || !fieldNames.has(detail.field))) {
        setServerError(getApiErrorMessage(error))
      }
    }
  }

  function toggleMember(memberName: string) {
    setTeam((t) =>
      t.includes(memberName)
        ? t.filter((x) => x !== memberName)
        : [...t, memberName]
    )
  }

  return (
    <Modal
      title={initial ? 'Editar Projeto' : 'Novo Projeto'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initial ? 'Salvar alterações' : 'Criar Projeto'}
      wide
    >
      {serverError && (
        <div role="alert" style={{ marginBottom: 12, padding: '10px 12px', backgroundColor: c.redLight, color: c.red, borderRadius: 8, fontSize: 13 }}>
          {serverError}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <Field label="Nome do projeto" required error={errors.name}>
            <Inp
              value={name}
              onChange={setName}
              placeholder="Ex: App Mobile v2"
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              value={description}
              onChange={setDescription}
              placeholder="Objetivo do projeto…"
            />
          </Field>

          <Field label="Cliente">
            <Sel
              value={clientId}
              onChange={setClientId}
              options={clients.map((client) => ({
                value: String(client.id),
                label: client.name
              }))}
            />
          </Field>

          <Field label="Cor">
            <ColorPicker
              colors={PROJ_PALETTE}
              value={color}
              onChange={setColor}
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            <Field label="Início" required error={errors.startDate}>
              <Inp
                type="date"
                value={startDate}
                onChange={setStartDate}
              />
              {startDate && (
                <span style={{ fontSize: 11, color: c.textMuted }}>
                  Selecionada: {fmtDate(startDate)}
                </span>
              )}
            </Field>

            <Field label="Entrega" required error={errors.endDate}>
              <Inp
                type="date"
                value={endDate}
                onChange={setEndDate}
              />
            </Field>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <Field label="Equipe">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                maxHeight: 170,
                overflowY: 'auto'
              }}
            >
              {members.map((m) => (
                <MemberPickerRow
                  key={m.id}
                  member={m}
                  selected={team.includes(m.name)}
                  onToggle={toggleMember}
                  showWorkload={false}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
