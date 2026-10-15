import { useEffect, useState } from 'react'
import * as api from '../api'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'
import { DataState } from '../components/layout'
import type { Organization } from '../types'

const emptyOrganization: Organization = {
  id: 0,
  tradeName: '',
  legalName: '',
  cnpj: '',
  contact: '',
  email: '',
  phone: '',
}

export default function OrganizationPage() {
  const [organization, setOrganization] = useState(emptyOrganization)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setOrganization(await api.organizacoes.obterMinhaOrganizacao())
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function update(field: keyof Organization, value: string) {
    setSaved(false)
    setOrganization((current) => ({ ...current, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      setOrganization(await api.organizacoes.atualizarOrganizacao(organization))
      setSaved(true)
    } catch (requestError) {
      setError(api.getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DataState loading />
  if (error && !organization.id) return <DataState error={error} onRetry={load} />

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-7">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="text-lg font-bold text-text-primary">Dados da organização</div>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              Estas informações identificam sua empresa e serão usadas nos projetos e convites.
            </p>
          </div>
          <div className="rounded-lg bg-blue-light px-3 py-2 text-xs font-semibold text-blue">
            Perfil gestor
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nome fantasia" required>
            <Inp value={organization.tradeName} onChange={(value) => update('tradeName', value)} />
          </Field>
          <Field label="Razão social">
            <Inp value={organization.legalName} onChange={(value) => update('legalName', value)} />
          </Field>
          <Field label="CNPJ">
            <Inp value={organization.cnpj} onChange={(value) => update('cnpj', value)} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Pessoa de contato">
            <Inp value={organization.contact} onChange={(value) => update('contact', value)} />
          </Field>
          <Field label="E-mail">
            <Inp type="email" value={organization.email} onChange={(value) => update('email', value)} />
          </Field>
          <Field label="Telefone">
            <Inp value={organization.phone} onChange={(value) => update('phone', value)} placeholder="(00) 00000-0000" />
          </Field>
        </div>

        {error && <div role="alert" className="mt-5 rounded-lg border border-red/20 bg-red-light p-3 text-sm text-red">{error}</div>}
        {saved && <div role="status" className="mt-5 rounded-lg border border-green/20 bg-green-light p-3 text-sm text-green">Organização atualizada com sucesso.</div>}

        <div className="mt-6 flex justify-end">
          <BtnPrimary onClick={save} disabled={saving || !organization.tradeName.trim()}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </BtnPrimary>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Gestor da organização', 'Pode administrar clientes, usuários, projetos e dados cadastrais.'],
          ['Desenvolvedores', 'Entram somente por convite ou código de acesso e visualizam os dados permitidos.'],
          ['Isolamento de dados', 'Todos os registros são vinculados à organização autenticada.'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-sm font-semibold text-text-primary">{title}</div>
            <p className="mt-2 text-xs leading-5 text-text-muted">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
