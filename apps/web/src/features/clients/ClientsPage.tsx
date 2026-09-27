import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createClient,
  deleteClient,
  getClient,
  getClients,
  updateClient,
} from './clients.api'
import type { ClientInput, ClientRecord, ClientStatus } from './clients.api'
import './ClientsPage.css'

type ClientFormValues = {
  name: string
  email: string
  phone: string
  document: string
  notes: string
  status: ClientStatus
}

const EMPTY_FORM: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  document: '',
  notes: '',
  status: 'ACTIVE',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

function getAccessToken() {
  return sessionStorage.getItem('rodstones.accessToken')
}

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClientStatus>('ALL')

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null)
  const [formValues, setFormValues] = useState<ClientFormValues>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setListError('Sua sessão expirou. Entre novamente para ver os clientes.')
      setIsLoading(false)
      return
    }

    let active = true
    void getClients(token)
      .then((result) => {
        if (active) setClients(result)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setListError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os clientes.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectedClientId === null) {
      setSelectedClient(null)
      setDetailsError('')
      return
    }

    const token = getAccessToken()
    if (!token) {
      setDetailsError('Sua sessão expirou. Entre novamente para ver os detalhes.')
      return
    }

    let active = true
    setIsLoadingDetails(true)
    setDetailsError('')

    void getClient(token, selectedClientId)
      .then((client) => {
        if (active) setSelectedClient(client)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setDetailsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os detalhes do cliente.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingDetails(false)
      })

    return () => {
      active = false
    }
  }, [selectedClientId])

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const filteredClients = clients.filter((client) => {
    const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter
    const matchesSearch = !normalizedSearch || [
      client.name,
      client.email ?? '',
      client.phone ?? '',
      client.document ?? '',
    ].some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    return matchesStatus && matchesSearch
  })
  const activeCount = clients.filter((client) => client.status === 'ACTIVE').length
  const inactiveCount = clients.length - activeCount

  function openCreateForm() {
    setEditingClient(null)
    setFormValues(EMPTY_FORM)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(client: ClientRecord) {
    setEditingClient(client)
    setFormValues({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      document: client.document ?? '',
      notes: client.notes ?? '',
      status: client.status,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setFormError('')
  }

  async function handleSaveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = getAccessToken()
    if (!token) {
      setFormError('Sua sessão expirou. Entre novamente para continuar.')
      return
    }

    const input: ClientInput = {
      name: formValues.name.trim(),
      email: formValues.email.trim() || undefined,
      phone: formValues.phone.trim() || undefined,
      document: formValues.document.trim() || undefined,
      notes: formValues.notes.trim() || undefined,
    }

    setFormError('')
    setIsSaving(true)
    try {
      const savedClient = editingClient
        ? await updateClient(token, editingClient.id, {
          ...input,
          status: formValues.status,
        })
        : await createClient(token, input)

      setClients((current) => [
        ...current.filter((client) => client.id !== savedClient.id),
        savedClient,
      ].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')))
      setIsFormOpen(false)
      if (editingClient) setSelectedClient(savedClient)
      else setSelectedClientId(savedClient.id)
    } catch (requestError) {
      setFormError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível salvar o cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteClient() {
    if (!selectedClient) return
    const token = getAccessToken()
    if (!token) {
      setDeleteError('Sua sessão expirou. Entre novamente para continuar.')
      return
    }

    setDeleteError('')
    setIsDeleting(true)
    try {
      await deleteClient(token, selectedClient.id)
      setClients((current) => current.filter((client) => client.id !== selectedClient.id))
      setIsDeleteOpen(false)
      setSelectedClientId(null)
      setSelectedClient(null)
    } catch (requestError) {
      setDeleteError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível excluir o cliente.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="clients-main">
      <header className="clients-header">
        <div>
          <p className="eyebrow">RELACIONAMENTO COMERCIAL</p>
          <h1>Clientes</h1>
          <p>Consulte contatos, acompanhe status e mantenha os dados atualizados.</p>
        </div>
        <button className="clients-primary-button" type="button" onClick={openCreateForm}>
          <span aria-hidden="true">+</span> Adicionar cliente
        </button>
      </header>

      <section className="clients-summary" aria-label="Resumo de clientes">
        <div><strong>{clients.length}</strong><span>Total de clientes</span></div>
        <div><strong>{activeCount}</strong><span>Ativos</span></div>
        <div><strong>{inactiveCount}</strong><span>Inativos</span></div>
      </section>

      <div className="clients-toolbar">
        <label className="clients-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou documento"
            aria-label="Buscar clientes"
          />
        </label>
        <label className="clients-status-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | ClientStatus)}
            aria-label="Filtrar por status"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </select>
        </label>
        <span className="clients-result-count">
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>

      <section className="clients-list" aria-label="Lista de clientes">
        <div className="clients-list-header" aria-hidden="true">
          <span>Cliente</span>
          <span>Contato</span>
          <span>Documento</span>
          <span>Status</span>
        </div>
        {isLoading && <p className="clients-message" aria-live="polite">Carregando clientes...</p>}
        {listError && <p className="clients-error" role="alert">{listError}</p>}
        {!isLoading && !listError && filteredClients.length === 0 && (
          <div className="clients-empty">
            <span className="clients-empty-mark" aria-hidden="true">—</span>
            <p>{clients.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum cliente corresponde à busca.'}</p>
          </div>
        )}
        {!listError && filteredClients.map((client) => (
          <button
            className="client-row"
            key={client.id}
            type="button"
            onClick={() => setSelectedClientId(client.id)}
            aria-label={`Ver detalhes de ${client.name}`}
          >
            <span className="client-identity">
              <span className="client-avatar" aria-hidden="true">{getInitials(client.name)}</span>
              <span className="client-row-name">
                <strong>{client.name}</strong>
                <small>{client.email || 'Sem e-mail cadastrado'}</small>
              </span>
            </span>
            <span className="client-row-contact">{client.phone || '—'}</span>
            <span className="client-row-document">{client.document || '—'}</span>
            <span className={`client-status status-${client.status.toLowerCase()}`}>
              {client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
            </span>
          </button>
        ))}
      </section>

      {selectedClientId !== null && (
        <div className="client-detail-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedClientId(null)
        }}>
          <aside className="client-detail-panel" role="dialog" aria-modal="true" aria-labelledby="client-detail-title">
            <button
              className="client-close-button"
              type="button"
              onClick={() => setSelectedClientId(null)}
              aria-label="Fechar detalhes do cliente"
            >
              ×
            </button>
            {isLoadingDetails && <p className="clients-message">Carregando detalhes...</p>}
            {detailsError && <p className="clients-error" role="alert">{detailsError}</p>}
            {selectedClient && (
              <>
                <div className="client-detail-heading">
                  <span className="client-avatar client-avatar-large" aria-hidden="true">
                    {getInitials(selectedClient.name)}
                  </span>
                  <div>
                    <span className={`client-status status-${selectedClient.status.toLowerCase()}`}>
                      {selectedClient.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                    <h2 id="client-detail-title">{selectedClient.name}</h2>
                    <p>Cliente desde {formatDate(selectedClient.createdAt)}</p>
                  </div>
                </div>

                <section className="client-detail-section">
                  <h3>Informações de contato</h3>
                  <dl className="client-detail-grid">
                    <div><dt>E-mail</dt><dd>{selectedClient.email || 'Não informado'}</dd></div>
                    <div><dt>Telefone</dt><dd>{selectedClient.phone || 'Não informado'}</dd></div>
                    <div><dt>Documento</dt><dd>{selectedClient.document || 'Não informado'}</dd></div>
                    <div><dt>Última atualização</dt><dd>{formatDate(selectedClient.updatedAt)}</dd></div>
                  </dl>
                </section>

                <section className="client-detail-section client-notes-section">
                  <h3>Observações</h3>
                  <p>{selectedClient.notes || 'Nenhuma observação registrada.'}</p>
                </section>

                <div className="client-detail-actions">
                  <button className="client-delete-button" type="button" onClick={() => {
                    setDeleteError('')
                    setIsDeleteOpen(true)
                  }}>
                    Excluir
                  </button>
                  <button className="clients-primary-button" type="button" onClick={() => openEditForm(selectedClient)}>
                    Editar cliente
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {isFormOpen && (
        <div className="client-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm()
        }}>
          <section className="client-modal" role="dialog" aria-modal="true" aria-labelledby="client-form-title">
            <button className="client-close-button" type="button" onClick={closeForm} aria-label="Fechar formulário" disabled={isSaving}>
              ×
            </button>
            <p className="eyebrow">CADASTRO DE CLIENTES</p>
            <h2 id="client-form-title">{editingClient ? 'Editar cliente' : 'Adicionar cliente'}</h2>
            <form className="client-form" onSubmit={handleSaveClient}>
              <label htmlFor="client-name">Nome</label>
              <input
                id="client-name"
                value={formValues.name}
                onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                maxLength={150}
                required
                autoFocus
              />
              <div className="client-form-two-columns">
                <div>
                  <label htmlFor="client-email">E-mail</label>
                  <input
                    id="client-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                    maxLength={255}
                  />
                </div>
                <div>
                  <label htmlFor="client-phone">Telefone</label>
                  <input
                    id="client-phone"
                    value={formValues.phone}
                    onChange={(event) => setFormValues((current) => ({ ...current, phone: event.target.value }))}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="client-form-two-columns">
                <div>
                  <label htmlFor="client-document">Documento</label>
                  <input
                    id="client-document"
                    value={formValues.document}
                    onChange={(event) => setFormValues((current) => ({ ...current, document: event.target.value }))}
                    maxLength={30}
                  />
                </div>
                {editingClient && (
                  <div>
                    <label htmlFor="client-status">Status</label>
                    <select
                      id="client-status"
                      value={formValues.status}
                      onChange={(event) => setFormValues((current) => ({
                        ...current,
                        status: event.target.value as ClientStatus,
                      }))}
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                    </select>
                  </div>
                )}
              </div>
              <label htmlFor="client-notes">Observações</label>
              <textarea
                id="client-notes"
                value={formValues.notes}
                onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
                maxLength={1000}
                rows={4}
              />
              {formError && <p className="clients-error" role="alert">{formError}</p>}
              <div className="client-form-actions">
                <button className="client-cancel-button" type="button" onClick={closeForm} disabled={isSaving}>
                  Cancelar
                </button>
                <button className="clients-primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Adicionar cliente'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isDeleteOpen && selectedClient && (
        <div className="client-modal-backdrop delete-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setIsDeleteOpen(false)
        }}>
          <section className="client-delete-modal" role="dialog" aria-modal="true" aria-labelledby="client-delete-title">
            <p className="eyebrow">CONFIRMAR EXCLUSÃO</p>
            <h2 id="client-delete-title">Excluir {selectedClient.name}?</h2>
            <p>A exclusão é lógica. Clientes com shares vinculadas não podem ser removidos.</p>
            {deleteError && <p className="clients-error" role="alert">{deleteError}</p>}
            <div className="client-form-actions">
              <button className="client-cancel-button" type="button" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
                Cancelar
              </button>
              <button className="client-delete-confirm-button" type="button" onClick={handleDeleteClient} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir cliente'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}