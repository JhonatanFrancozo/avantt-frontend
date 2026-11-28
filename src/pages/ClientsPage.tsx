import { useEffect, useState } from 'react'
import * as api from '../api'
import type { ClientInput } from '../api/clientes'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'
import { DataState, EmptyState } from '../components/layout'
import Modal from '../components/Modal'
import type { Client } from '../types'
import type { Project } from '../types'

const emptyClient: ClientInput = {
  name: '',
  document: '',
  email: '',
  phone: '',
}

function formatDocument(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPhone(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client?: Client
  onClose: () => void
  onSave: (body: ClientInput) => Promise<void>
}) {
  const [form, setForm] = useState<ClientInput>(client ? {
    name: client.name ?? '',
    document: formatDocument(client.document),
    email: client.email ?? '',
    phone: formatPhone(client.phone),
  } : emptyClient)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof ClientInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit() {
    if (!form.name.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Informe um e-mail válido para contato.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      })
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={client ? 'Editar cliente' : 'Cadastrar cliente'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={saving ? 'Salvando...' : client ? 'Salvar alterações' : 'Cadastrar cliente'}
      wide
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-blue/20 bg-blue-light p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-blue">
            <span className="text-sm font-bold">i</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Cadastro interno de cliente</div>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              O cliente será associado à sua organização. Depois, vincule-o aos projetos para acompanhar sprints e relatórios. Este cadastro não cria uma organização separada nem envia convite ou libera acesso externo.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome da empresa" required>
            <Inp value={form.name} onChange={(value) => update('name', value)} placeholder="Ex.: Empresa cliente Ltda." autoComplete="organization" required />
          </Field>
          <Field label="CNPJ ou documento">
            <Inp value={form.document} onChange={(value) => update('document', formatDocument(value))} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="E-mail de contato">
            <Inp type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="contato@empresa.com" autoComplete="email" />
          </Field>
          <Field label="Telefone">
            <Inp type="tel" value={form.phone} onChange={(value) => update('phone', formatPhone(value))} placeholder="(00) 00000-0000" autoComplete="tel" />
          </Field>
        </div>
      </div>
      {error && <div role="alert" className="mt-5 rounded-lg bg-red-light p-3 text-sm text-red">{error}</div>}
    </Modal>
  )
}

export default function ClientsPage({ projects }: { projects: Project[] }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setClients(await api.clientes.listarClientes())
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save(body: ClientInput) {
    if (editing) {
      const updated = await api.clientes.atualizarCliente(editing.id, body)
      setClients((current) => current.map((client) => client.id === updated.id ? updated : client))
    } else {
      const created = await api.clientes.criarCliente(body)
      setClients((current) => [...current, created])
    }
    setEditing(null)
    setCreating(false)
  }

  if (loading) return <DataState loading />
  if (error) return <DataState error={error} onRetry={load} />

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-text-primary">{clients.length} cliente{clients.length === 1 ? '' : 's'}</div>
          <p className="mt-1 text-xs text-text-muted">Empresas vinculadas internamente aos projetos da sua organização.</p>
        </div>
        <BtnPrimary onClick={() => setCreating(true)}>Cadastrar cliente</BtnPrimary>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.length === 0 && (
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Cadastre uma empresa cliente e associe-a aos projetos para acompanhar sprints e relatórios."
            actionLabel="Cadastrar cliente"
            onAction={() => setCreating(true)}
          />
        )}
        {clients.map((client) => {
          const linkedProjectCount = projects.filter((project) => Number(project.clientId) === client.id).length
          return (
          <div key={client.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-light text-sm font-bold text-blue">
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <BtnPrimary variant="ghost" onClick={() => setEditing(client)}>Editar</BtnPrimary>
            </div>
            <div className="mt-4 font-semibold text-text-primary">{client.name}</div>
            <div className="mt-1 text-xs text-text-muted">{client.document ? formatDocument(client.document) : 'Documento não informado'}</div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-text-secondary">
              <div>{client.email || 'E-mail não informado'}</div>
              <div>{client.phone ? formatPhone(client.phone) : 'Telefone não informado'}</div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-bg px-3 py-2">
              <span className="text-xs text-text-muted">Projetos vinculados</span>
              <span className="text-xs font-semibold text-text-primary">
                {linkedProjectCount} projeto{linkedProjectCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          )
        })}
      </div>

      {(creating || editing) && (
        <ClientModal client={editing ?? undefined} onClose={() => { setCreating(false); setEditing(null) }} onSave={save} />
      )}
    </div>
  )
}
