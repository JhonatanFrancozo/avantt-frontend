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
  defaultUser: {
    name: '',
    email: '',
    status: 'invite-pending',
    role: 'manager',
    projectIds: [],
  },
}

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function ClientModal({
  client,
  onClose,
  onSave,
  projects,
}: {
  client?: Client
  onClose: () => void
  onSave: (body: ClientInput) => Promise<void>
  projects: Project[]
}) {
  const [form, setForm] = useState<ClientInput>(client ? {
    name: client.name,
    document: client.document,
    email: client.email,
    phone: client.phone,
    defaultUser: client.defaultUser ?? {
      name: '',
      email: client.email,
      status: 'invite-pending',
      role: 'manager',
      projectIds: [],
    },
  } : emptyClient)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [projectIds, setProjectIds] = useState<string[]>(client?.defaultUser?.projectIds ?? [])

  function update(field: keyof ClientInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateUser(field: 'name' | 'email', value: string) {
    setForm((current) => ({
      ...current,
      defaultUser: { ...current.defaultUser!, [field]: value },
    }))
  }

  async function submit() {
    if (!form.name.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    if (!form.defaultUser?.email.trim()) {
      setError('Informe o e-mail do gestor da empresa cliente.')
      return
    }
    if (form.defaultUser?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.defaultUser.email)) {
      setError('Informe um e-mail válido para o gestor do cliente.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        email: form.defaultUser.email,
        defaultUser: form.defaultUser?.email ? {
          ...form.defaultUser,
          role: 'manager',
          status: 'invite-pending',
          projectIds,
        } : undefined,
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
      submitLabel={saving ? 'Salvando...' : client ? 'Salvar' : 'Cadastrar e convidar'}
      wide
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-text-primary">Empresa cliente</div>
          <Field label="Nome" required>
            <Inp value={form.name} onChange={(value) => update('name', value)} placeholder="Nome da empresa cliente" />
          </Field>
          <Field label="CNPJ ou documento">
            <Inp value={form.document} onChange={(value) => update('document', formatDocument(value))} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="E-mail do gestor para convite" required>
            <Inp type="email" value={form.defaultUser?.email ?? ''} onChange={(value) => updateUser('email', value)} placeholder="gestor@empresa.com" />
          </Field>
          <Field label="Telefone">
            <Inp value={form.phone} onChange={(value) => update('phone', formatPhone(value))} placeholder="(00) 00000-0000" />
          </Field>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-bg p-5">
          <div>
            <div className="text-sm font-semibold text-text-primary">Convite do gestor</div>
            <p className="mt-1 text-xs leading-5 text-text-muted">O gestor preencherá os próprios dados e definirá a senha pelo link enviado ao e-mail informado.</p>
          </div>
          <div className="rounded-lg border border-blue/20 bg-blue-light p-3 text-xs leading-5 text-blue">
            O acesso será limitado à empresa cliente e o convite ficará pendente até a aceitação.
          </div>
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
          <p className="mt-1 text-xs text-text-muted">Empresas atendidas pela sua organização.</p>
        </div>
        <BtnPrimary onClick={() => setCreating(true)}>Cadastrar cliente</BtnPrimary>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.length === 0 && (
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Cadastre uma empresa cliente e, se necessário, envie o acesso para o contato responsável."
            actionLabel="Cadastrar cliente"
            onAction={() => setCreating(true)}
          />
        )}
        {clients.map((client) => (
          <div key={client.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-light text-sm font-bold text-blue">
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <BtnPrimary variant="ghost" onClick={() => setEditing(client)}>Editar</BtnPrimary>
            </div>
            <div className="mt-4 font-semibold text-text-primary">{client.name}</div>
            <div className="mt-1 text-xs text-text-muted">{client.document || 'Documento não informado'}</div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-text-secondary">
              <div>{client.email || 'E-mail não informado'}</div>
              <div>{client.phone || 'Telefone não informado'}</div>
            </div>
            {client.defaultUser?.email && (
              <div className="mt-4 rounded-lg bg-bg p-3">
                <div className="text-xs font-semibold text-text-primary">{client.defaultUser.name}</div>
                <div className="mt-1 text-xs text-text-muted">{client.defaultUser.email}</div>
                <div className="mt-2 text-xs font-semibold text-blue">Gestor</div>
                <div className="mt-1 text-xs text-text-muted">
                  {client.defaultUser.projectIds?.length ?? 0} projeto{client.defaultUser.projectIds?.length === 1 ? '' : 's'} permitido{client.defaultUser.projectIds?.length === 1 ? '' : 's'}
                </div>
                <div className="mt-2 inline-flex rounded-full bg-amber-light px-2 py-1 text-xs font-medium text-amber">
                  {client.defaultUser.status === 'active' ? 'Acesso ativo' : 'Convite pendente'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <ClientModal projects={projects} client={editing ?? undefined} onClose={() => { setCreating(false); setEditing(null) }} onSave={save} />
      )}
    </div>
  )
}
