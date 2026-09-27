import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getBundleDetails, getBundleInventory } from './bundles.api'
import type { BundleDetails, BundleInventoryItem } from './bundles.types'
import { getClients } from '../clients/clients.api'
import type { ClientOption } from '../clients/clients.api'
import { createShare } from '../shares/shares.api'
import type { CreatedShare } from '../shares/shares.api'
import './BundlesPage.css'

type BundlesPageProps = {
  onShareCreated: () => void
}

function formatValue(value: number | string | null, unit = '') {
  if (value === null) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${number.toLocaleString('pt-BR')}${unit}`
}

function formatCurrency(value: number | string | null) {
  if (value === null) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number)
}

function getSlabStatusLabel(status: string) {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponível',
    RESERVED: 'Reservada',
    SOLD: 'Vendida',
    INACTIVE: 'Inativa',
  }
  return labels[status] ?? status
}

function BundleCard({
  bundle,
  selected,
  isSelectionMode,
  onToggle,
  onOpenDetails,
}: {
  bundle: BundleInventoryItem
  selected: boolean
  isSelectionMode: boolean
  onToggle: (bundleId: number) => void
  onOpenDetails: (bundle: BundleInventoryItem) => void
}) {
  const image = bundle.images.find((item) => item.isPrimary) ?? bundle.images[0]

  return (
    <article className={`inventory-card${selected ? ' is-selected' : ''}`}>
      {isSelectionMode && (
        <input
          className="inventory-card-checkbox"
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(bundle.id)}
          aria-label={`Selecionar bundle ${bundle.bundleCode}`}
        />
      )}
      <button
        className="inventory-card-main"
        type="button"
        onClick={() => isSelectionMode ? onToggle(bundle.id) : onOpenDetails(bundle)}
        aria-label={isSelectionMode
          ? `${selected ? 'Desmarcar' : 'Selecionar'} bundle ${bundle.bundleCode}`
          : `Ver detalhes do bundle ${bundle.bundleCode}`}
      >
        {image ? (
          <img className="inventory-image" src={image.url} alt={bundle.material.name} />
        ) : (
          <div className="inventory-image image-placeholder" aria-hidden="true">RS</div>
        )}
        <div className="inventory-card-content">
          <div className="inventory-card-heading">
            <div>
              <span className="inventory-category">{bundle.material.name}</span>
              <h2>{bundle.bundleCode}</h2>
            </div>
            <span className="available-count">
              {bundle.availableSlabCount} <small>chapas</small>
            </span>
          </div>
          <p className="inventory-description">
            {bundle.materialType.name} · {bundle.materialClassification.name}
          </p>
          <div className="inventory-details">
            <span><small>Qualidade</small>{bundle.quality.name}</span>
            <span><small>Acabamento</small>{bundle.finish.name}</span>
            <span><small>Espessura</small>{formatValue(bundle.thickness, ' mm')}</span>
            <span><small>Peso</small>{formatValue(bundle.weight, ' kg')}</span>
            <span><small>Preço</small>{formatCurrency(bundle.basePrice)}</span>
          </div>
          <span className="inventory-card-action">
            {isSelectionMode ? (selected ? 'Selecionado' : 'Clique para selecionar') : 'Ver slabs e detalhes'}
          </span>
        </div>
      </button>
    </article>
  )
}

export function BundlesPage({ onShareCreated }: BundlesPageProps) {
  const [bundles, setBundles] = useState<BundleInventoryItem[]>([])
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [bundleForDetails, setBundleForDetails] = useState<BundleInventoryItem | null>(null)
  const [bundleDetails, setBundleDetails] = useState<BundleDetails | null>(null)
  const [isLoadingBundleDetails, setIsLoadingBundleDetails] = useState(false)
  const [bundleDetailsError, setBundleDetailsError] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [shareTitle, setShareTitle] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [isCreatingShare, setIsCreatingShare] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [createdShare, setCreatedShare] = useState<CreatedShare | null>(null)
  const detailsBundleId = bundleForDetails?.id

  useEffect(() => {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setInventoryError('Sua sessão expirou. Entre novamente para ver o estoque.')
      setIsLoading(false)
      return
    }

    let active = true
    void getBundleInventory(token)
      .then((result) => {
        if (active) setBundles(Array.isArray(result) ? result : [])
      })
      .catch((requestError: unknown) => {
        if (active) {
          setInventoryError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar o estoque.')
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
    if (detailsBundleId === undefined) {
      setBundleDetails(null)
      setBundleDetailsError('')
      return
    }

    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setBundleDetailsError('Sua sessão expirou. Entre novamente para ver os detalhes.')
      return
    }

    let active = true
    setBundleDetails(null)
    setBundleDetailsError('')
    setIsLoadingBundleDetails(true)

    void getBundleDetails(token, detailsBundleId)
      .then((details) => {
        if (active) setBundleDetails(details)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setBundleDetailsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os detalhes do bundle.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingBundleDetails(false)
      })

    return () => {
      active = false
    }
  }, [detailsBundleId])

  const availableBundles = bundles.filter(
    (bundle) => bundle.status === 'AVAILABLE' && bundle.availableSlabCount > 0,
  )
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const filteredBundles = normalizedSearch
    ? availableBundles.filter((bundle) => [
      bundle.bundleCode,
      bundle.material.name,
      bundle.materialType.name,
      bundle.materialClassification.name,
      bundle.location ?? '',
      bundle.block ?? '',
    ].some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch)))
    : availableBundles
  const selectedBundles = availableBundles.filter(
    (bundle) => selectedBundleIds.includes(bundle.id),
  )
  const selectedSlabCount = selectedBundles.reduce(
    (total, bundle) => total + bundle.availableSlabCount,
    0,
  )

  function toggleBundle(bundleId: number) {
    setSelectedBundleIds((selected) => selected.includes(bundleId)
      ? selected.filter((id) => id !== bundleId)
      : [...selected, bundleId])
  }

  function toggleSelectionMode() {
    if (isSelectionMode) {
      setSelectedBundleIds([])
      setIsSelectionMode(false)
      return
    }
    setIsSelectionMode(true)
  }

  function closeBundleDetails() {
    setBundleForDetails(null)
    setBundleDetails(null)
    setBundleDetailsError('')
  }

  function addBundleFromDetails() {
    if (!bundleForDetails) return
    setIsSelectionMode(true)
    setSelectedBundleIds((selected) => selected.includes(bundleForDetails.id)
      ? selected
      : [...selected, bundleForDetails.id])
    closeBundleDetails()
  }

  async function openShareDialog() {
    setDialogError('')
    setCreatedShare(null)
    setSelectedClientId('')
    setIsDialogOpen(true)
    setIsLoadingClients(true)

    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setDialogError('Sua sessão expirou. Entre novamente para continuar.')
      setIsLoadingClients(false)
      return
    }

    try {
      setClients(await getClients(token))
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível carregar os clientes.')
    } finally {
      setIsLoadingClients(false)
    }
  }

  function closeShareDialog() {
    if (isCreatingShare) return
    setIsDialogOpen(false)
    setDialogError('')
    setCreatedShare(null)
  }

  async function handleCreateShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setDialogError('Sua sessão expirou. Entre novamente para continuar.')
      return
    }

    setDialogError('')
    setIsCreatingShare(true)
    try {
      const result = await createShare(token, {
        clientId: Number(selectedClientId),
        bundleIds: selectedBundles.map((bundle) => bundle.id),
        ...(shareTitle.trim() && { title: shareTitle.trim() }),
        ...(expirationDate && {
          expiresAt: new Date(`${expirationDate}T23:59:59`).toISOString(),
        }),
      })
      setCreatedShare(result)
      setSelectedBundleIds([])
      setIsSelectionMode(false)
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível criar a share.')
    } finally {
      setIsCreatingShare(false)
    }
  }

  return (
    <main className="inventory-main">
      <section className="inventory-header">
        <div>
          <p className="eyebrow">CATÁLOGO DA MARMORARIA</p>
          <h1>Estoque disponível</h1>
          <p>{isSelectionMode
            ? 'Clique nos bundles que deseja incluir na share.'
            : 'Abra um bundle para ver suas slabs e informações.'}</p>
        </div>
        <div className="inventory-summary" aria-live="polite">
          <strong>{availableBundles.length}</strong>
          <span>bundles disponíveis</span>
          <i aria-hidden="true" />
          <strong>{availableBundles.reduce((total, bundle) => total + bundle.availableSlabCount, 0)}</strong>
          <span>chapas livres</span>
        </div>
      </section>

      <div className="inventory-toolbar">
        <label className="inventory-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por código, material ou localização"
            aria-label="Buscar no estoque"
          />
        </label>
        <span className="inventory-result-count">
          {filteredBundles.length} {filteredBundles.length === 1 ? 'resultado' : 'resultados'}
        </span>
        <button
          className={`selection-mode-button${isSelectionMode ? ' is-active' : ''}`}
          type="button"
          aria-pressed={isSelectionMode}
          onClick={toggleSelectionMode}
        >
          {isSelectionMode ? 'Cancelar seleção' : 'Selecionar bundles'}
        </button>
      </div>

      <section className="inventory-list" aria-label="Bundles disponíveis">
        {isLoading && <p className="inventory-message" aria-live="polite">Carregando estoque...</p>}
        {inventoryError && <p className="inventory-error" role="alert">{inventoryError}</p>}
        {!isLoading && !inventoryError && filteredBundles.length === 0 && (
          <div className="inventory-empty">
            <span className="empty-mark" aria-hidden="true">—</span>
            <p>{availableBundles.length === 0
              ? 'Não há bundles com chapas disponíveis no momento.'
              : 'Nenhum bundle corresponde à busca.'}</p>
          </div>
        )}
        <div className="inventory-grid">
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              selected={selectedBundleIds.includes(bundle.id)}
              isSelectionMode={isSelectionMode}
              onToggle={toggleBundle}
              onOpenDetails={setBundleForDetails}
            />
          ))}
        </div>
      </section>

      {isSelectionMode && <div className="inventory-selection-bar" aria-live="polite">
        <div>
          <strong>{selectedBundles.length}</strong>
          <span>{selectedBundles.length === 1 ? 'bundle selecionado' : 'bundles selecionados'}</span>
          {selectedSlabCount > 0 && <span className="selection-detail">{selectedSlabCount} chapas livres</span>}
        </div>
        <button
          className="inventory-create-button"
          type="button"
          disabled={selectedBundles.length === 0}
          onClick={openShareDialog}
        >
          Criar share <span aria-hidden="true">↗</span>
        </button>
      </div>}

      {bundleForDetails && (
        <div className="share-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeBundleDetails()
        }}>
          <section
            className="bundle-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bundle-detail-title"
          >
            <button
              className="share-dialog-close"
              type="button"
              onClick={closeBundleDetails}
              aria-label="Fechar detalhes do bundle"
            >
              ×
            </button>
            <p className="eyebrow">DETALHES DO ESTOQUE</p>
            <h2 id="bundle-detail-title">{bundleForDetails.bundleCode}</h2>
            {isLoadingBundleDetails && (
              <p className="inventory-message" aria-live="polite">Carregando slabs...</p>
            )}
            {bundleDetailsError && <p className="inventory-error" role="alert">{bundleDetailsError}</p>}
            {bundleDetails && (
              <>
                <div className="bundle-detail-overview">
                  {(() => {
                    const image = bundleDetails.images.find((item) => item.isPrimary) ?? bundleDetails.images[0]
                    return image
                      ? <img src={image.url} alt={bundleDetails.material.name} />
                      : <div className="image-placeholder" aria-hidden="true">RS</div>
                  })()}
                  <div>
                    <p>{bundleDetails.material.name}</p>
                    <strong>{bundleDetails.materialType.name} · {bundleDetails.materialClassification.name}</strong>
                    <span>{bundleDetails.quality.name} · {bundleDetails.finish.name}</span>
                  </div>
                </div>
                <div className="bundle-detail-stats">
                  <span><small>Slabs disponíveis</small>{bundleForDetails.availableSlabCount} / {bundleDetails.slabs.length}</span>
                  <span><small>Espessura</small>{formatValue(bundleDetails.thickness, ' mm')}</span>
                  <span><small>Peso</small>{formatValue(bundleDetails.weight, ' kg')}</span>
                  {bundleDetails.location && <span><small>Localização</small>{bundleDetails.location}</span>}
                  {bundleDetails.block && <span><small>Bloco</small>{bundleDetails.block}</span>}
                </div>
                <section className="slab-list" aria-label="Slabs do bundle">
                  <header>
                    <h3>Slabs</h3>
                    <span>{bundleDetails.slabs.length} no bundle</span>
                  </header>
                  {bundleDetails.slabs.length > 0 ? (
                    <div className="slab-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Nº</th>
                            <th>Status</th>
                            <th>Comprimento</th>
                            <th>Altura</th>
                            <th>Área</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bundleDetails.slabs.map((slab) => (
                            <tr key={slab.id}>
                              <td>{slab.number}</td>
                              <td><span className={`slab-status status-${slab.status.toLocaleLowerCase()}`}>
                                {getSlabStatusLabel(slab.status)}
                              </span></td>
                              <td>{formatValue(slab.length)}</td>
                              <td>{formatValue(slab.height)}</td>
                              <td>{formatValue(slab.area)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="slab-list-empty">Nenhuma slab cadastrada neste bundle.</p>
                  )}
                </section>
                <div className="bundle-detail-actions">
                  <button className="share-cancel-button" type="button" onClick={closeBundleDetails}>
                    Fechar
                  </button>
                  <button className="inventory-create-button" type="button" onClick={addBundleFromDetails}>
                    Selecionar para share <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {isDialogOpen && (
        <div className="share-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeShareDialog()
        }}>
          <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
            <button
              className="share-dialog-close"
              type="button"
              onClick={closeShareDialog}
              aria-label="Fechar"
              disabled={isCreatingShare}
            >
              ×
            </button>
            {createdShare ? (
              <div className="share-created-state" aria-live="polite">
                <p className="eyebrow">COMPARTILHAMENTO PRONTO</p>
                <h2 id="share-dialog-title">Share criada</h2>
                <p>{createdShare.title || 'A oferta foi criada com sucesso.'}</p>
                <button className="inventory-create-button" type="button" onClick={onShareCreated}>
                  Ir para ofertas <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow">NOVA OFERTA</p>
                <h2 id="share-dialog-title">Criar share</h2>
                <p className="share-dialog-summary">
                  {selectedBundles.length} {selectedBundles.length === 1 ? 'bundle selecionado' : 'bundles selecionados'}
                </p>
                <form className="share-form" onSubmit={handleCreateShare}>
                  <label htmlFor="share-client">Cliente</label>
                  <select
                    id="share-client"
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                    required
                    disabled={isLoadingClients || clients.length === 0}
                  >
                    <option value="">
                      {isLoadingClients ? 'Carregando clientes...' : 'Selecione um cliente'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  {!isLoadingClients && clients.length === 0 && !dialogError && (
                    <p className="share-form-hint">Cadastre um cliente antes de criar uma share.</p>
                  )}

                  <label htmlFor="share-title">Título <span>opcional</span></label>
                  <input
                    id="share-title"
                    value={shareTitle}
                    onChange={(event) => setShareTitle(event.target.value)}
                    maxLength={150}
                    placeholder="Ex.: Seleção de quartzitos"
                  />

                  <label htmlFor="share-expiration">Validade <span>opcional</span></label>
                  <input
                    id="share-expiration"
                    type="date"
                    min={new Date().toLocaleDateString('en-CA')}
                    value={expirationDate}
                    onChange={(event) => setExpirationDate(event.target.value)}
                  />

                  {dialogError && <p className="inventory-error" role="alert">{dialogError}</p>}
                  <div className="share-form-actions">
                    <button className="share-cancel-button" type="button" onClick={closeShareDialog}>
                      Cancelar
                    </button>
                    <button
                      className="inventory-create-button"
                      type="submit"
                      disabled={isCreatingShare || isLoadingClients || clients.length === 0}
                    >
                      {isCreatingShare ? 'Criando...' : 'Criar share'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}