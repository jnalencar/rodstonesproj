import { useEffect, useState } from 'react'
import type { DragEvent } from 'react'
import { getShares } from './sales-pipeline.api'
import { createReservationRequest, getReservation, getReservations } from './reservations.api'
import type { ReservationDetails, ReservationStatus, ReservationSummary } from './reservations.api'
import type { BoardColumn, ShareOffer } from './sales-pipeline.types'
import { getPublicShare } from '../shares/shares.api'
import type { PublicShare } from '../shares/shares.api'
import './SalesPipelinePage.css'

const BOARD_COLUMNS: BoardColumn[] = [
  {
    key: 'offers',
    title: 'Ofertas',
    description: 'Shares compartilhadas com clientes',
    emptyMessage: 'As ofertas criadas aparecerão aqui.',
  },
  {
    key: 'reservations',
    title: 'Reservas',
    description: 'Reservas solicitadas pelos clientes',
    emptyMessage: 'As solicitações de reserva aparecerão aqui.',
  },
  {
    key: 'negotiation',
    title: 'Negociação',
    description: 'Etapa sugerida',
    emptyMessage: 'Espaço reservado para esta etapa.',
  },
  {
    key: 'payment',
    title: 'Pagamento',
    description: 'Etapa sugerida',
    emptyMessage: 'Espaço reservado para esta etapa.',
  },
  {
    key: 'logistics',
    title: 'Logística',
    description: 'Etapa sugerida',
    emptyMessage: 'Espaço reservado para esta etapa.',
  },
  {
    key: 'invoices',
    title: 'Invoices',
    description: 'Vendas concluídas',
    emptyMessage: 'Os invoices das vendas concluídas aparecerão aqui.',
  },
]

type SalesPipelinePageProps = {
  companyId: number
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMeasure(value: number | string | null, unit: string) {
  if (value === null) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${number.toLocaleString('pt-BR')}${unit}`
}

function getReservationStatus(status: ReservationStatus) {
  const labels: Record<ReservationStatus, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovada',
    REJECTED: 'Recusada',
    CANCELLED: 'Cancelada',
  }
  return labels[status]
}

function OfferCard({
  share,
  onDragStart,
  onDragEnd,
}: {
  share: ShareOffer
  onDragStart: (share: ShareOffer) => void
  onDragEnd: () => void
}) {
  return (
    <a
      className="offer-card"
      href={`/share/${encodeURIComponent(share.token)}`}
      draggable="true"
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData('text/plain', share.token)
        onDragStart(share)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="offer-card-topline">
        <span className={`offer-status ${share.status === 'ACTIVE' ? 'is-active' : ''}`}>
          {share.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
        </span>
        <time dateTime={share.createdAt}>{formatDate(share.createdAt)}</time>
      </div>
      <h3>{share.title || `Oferta #${share.id}`}</h3>
      <div className="offer-client">
        <span>CLIENTE</span>
        <strong>{share.client?.name || 'Não informado'}</strong>
      </div>
      <div className="offer-seller">
        <span>VENDEDOR</span>
        <strong>{share.createdBy?.name || 'Vendedor não informado'}</strong>
      </div>
      <div className="offer-bundles">
        <div className="offer-bundles-heading">
          <span>BUNDLES</span>
          <strong>{share.itemCount}</strong>
        </div>
        <div className="bundle-tags">
          {share.items.slice(0, 3).map((item) => (
            <span className="bundle-tag" key={item.id}>
              {item.bundleCode || `Bundle ${item.id}`}
            </span>
          ))}
          {share.items.length > 3 && (
            <span className="bundle-tag bundle-tag-more">+{share.items.length - 3}</span>
          )}
        </div>
      </div>
      {share.expiresAt && (
        <p className="offer-expiration">Expira em {formatDate(share.expiresAt)}</p>
      )}
      <span className="offer-drag-hint" aria-hidden="true">⠿ Arraste para Reservas</span>
    </a>
  )
}

function ReservationFromShareDialog({
  share,
  onClose,
  onCreated,
}: {
  share: ShareOffer
  onClose: () => void
  onCreated: () => void
}) {
  const [catalog, setCatalog] = useState<PublicShare | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlabIds, setSelectedSlabIds] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    void getPublicShare(share.token)
      .then((result) => {
        if (active) setCatalog(result)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os bundles desta oferta.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [share.token])

  const availableSlabCount = catalog?.bundles.reduce(
    (total, bundle) => total + bundle.slabs.filter((slab) => slab.status === 'AVAILABLE').length,
    0,
  ) ?? 0

  function toggleSlab(slabId: number) {
    setSelectedSlabIds((selected) => selected.includes(slabId)
      ? selected.filter((id) => id !== slabId)
      : [...selected, slabId])
  }

  function toggleBundle(bundleId: number) {
    const slabIds = catalog?.bundles
      .find((bundle) => bundle.id === bundleId)
      ?.slabs.filter((slab) => slab.status === 'AVAILABLE')
      .map((slab) => slab.id) ?? []
    const allSelected = slabIds.length > 0 && slabIds.every((id) => selectedSlabIds.includes(id))

    setSelectedSlabIds((selected) => allSelected
      ? selected.filter((id) => !slabIds.includes(id))
      : [...new Set([...selected, ...slabIds])])
  }

  async function submitReservation() {
    setError('')
    setIsSubmitting(true)
    try {
      const result = await createReservationRequest(share.token, selectedSlabIds, message)
      setCreatedReservationId(result.id)
      onCreated()
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível criar a solicitação de reserva.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose()
    }}>
      <section className="reservation-dialog reservation-from-share-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-create-title">
        <button className="reservation-dialog-close" type="button" onClick={onClose} aria-label="Fechar reserva" disabled={isSubmitting}>
          ×
        </button>
        {createdReservationId !== null ? (
          <div className="reservation-created-state" aria-live="polite">
            <p className="eyebrow">RESERVA REGISTRADA</p>
            <h2 id="reservation-create-title">Solicitação criada</h2>
            <p>Reserva #{createdReservationId} para {share.client?.name || 'o cliente da oferta'}.</p>
            <button className="reservation-submit-button" type="button" onClick={onClose}>Concluir</button>
          </div>
        ) : (
          <>
            <header className="reservation-create-heading">
              <p className="eyebrow">NOVA RESERVA</p>
              <h2 id="reservation-create-title">{share.title || `Oferta #${share.id}`}</h2>
              <p>{share.client?.name || 'Cliente não informado'} · {share.createdBy?.name || 'Vendedor não informado'}</p>
            </header>

            {isLoading && <p className="column-loading" aria-live="polite">Carregando bundles e slabs...</p>}
            {error && <p className="column-error" role="alert">{error}</p>}

            {catalog && !isLoading && (
              <div className="reservation-share-bundles">
                {catalog.bundles.map((bundle) => {
                  const available = bundle.slabs.filter((slab) => slab.status === 'AVAILABLE')
                  const selectedCount = available.filter((slab) => selectedSlabIds.includes(slab.id)).length
                  const allSelected = available.length > 0 && selectedCount === available.length
                  return (
                    <section className="reservation-share-bundle" key={bundle.id}>
                      <header className="reservation-share-bundle-heading">
                        <div>
                          <h3>{bundle.bundleCode}</h3>
                          <p>{bundle.material.name} · {bundle.finish.name}</p>
                        </div>
                        <label className="bundle-select-control">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            disabled={available.length === 0}
                            onChange={() => toggleBundle(bundle.id)}
                            aria-label={`Selecionar todas as slabs disponíveis de ${bundle.bundleCode}`}
                          />
                          <span>{selectedCount}/{available.length} selecionadas</span>
                        </label>
                      </header>
                      <div className="reservation-share-slab-grid">
                        {bundle.slabs.map((slab) => {
                          const isAvailable = slab.status === 'AVAILABLE'
                          const image = slab.images[0]
                          return (
                            <label
                              className={`reservation-share-slab${selectedSlabIds.includes(slab.id) ? ' is-selected' : ''}${isAvailable ? '' : ' is-unavailable'}`}
                              key={slab.id}
                            >
                              {image ? (
                                <img src={image.url} alt={`Slab ${slab.number}`} />
                              ) : (
                                <span className="reservation-slab-image-placeholder" aria-hidden="true">
                                  {String(slab.number).padStart(2, '0')}
                                </span>
                              )}
                              <input
                                type="checkbox"
                                checked={selectedSlabIds.includes(slab.id)}
                                disabled={!isAvailable}
                                onChange={() => toggleSlab(slab.id)}
                                aria-label={`Selecionar slab ${slab.number} do bundle ${bundle.bundleCode}`}
                              />
                              <span className="reservation-share-slab-info">
                                <strong>Slab {String(slab.number).padStart(2, '0')}</strong>
                                <small>{formatMeasure(slab.length, ' cm')} × {formatMeasure(slab.height, ' cm')}</small>
                                <small>{formatMeasure(slab.area, ' m²')}</small>
                              </span>
                              <span className={`slab-state slab-state-${slab.status.toLowerCase()}`}>
                                {slab.status === 'AVAILABLE' ? 'Disponível' : slab.status === 'RESERVED' ? 'Reservada' : slab.status}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}

            {catalog && availableSlabCount === 0 && !isLoading && (
              <p className="reservation-no-slabs">Esta oferta não possui slabs disponíveis para reservar.</p>
            )}

            {catalog && availableSlabCount > 0 && !isLoading && (
              <div className="reservation-create-footer">
                <label className="reservation-message-field">
                  <span>Observação <small>opcional</small></span>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Adicione uma observação para a solicitação"
                  />
                </label>
                <div className="reservation-create-actions">
                  <span>{selectedSlabIds.length} {selectedSlabIds.length === 1 ? 'slab selecionada' : 'slabs selecionadas'}</span>
                  <button
                    className="reservation-submit-button"
                    type="button"
                    disabled={selectedSlabIds.length === 0 || isSubmitting}
                    onClick={submitReservation}
                  >
                    {isSubmitting ? 'Criando...' : 'Criar reserva'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function ReservationCard({
  reservation,
  onOpen,
}: {
  reservation: ReservationSummary
  onOpen: (reservationId: number) => void
}) {
  const bundleCodes = [...new Set(reservation.items.map(({ slab }) => slab.bundle.bundleCode))]

  return (
    <button
      className="reservation-card"
      type="button"
      onClick={() => onOpen(reservation.id)}
      aria-label={`Ver reserva ${reservation.id} de ${reservation.share.client.name}`}
    >
      <div className="reservation-card-topline">
        <span className={`reservation-status reservation-${reservation.status.toLowerCase()}`}>
          {getReservationStatus(reservation.status)}
        </span>
        <time dateTime={reservation.createdAt}>{formatDate(reservation.createdAt)}</time>
      </div>
      <h3>Reserva #{reservation.id}</h3>
      <div className="reservation-card-person">
        <span>CLIENTE</span>
        <strong>{reservation.share.client.name}</strong>
      </div>
      <div className="reservation-card-person">
        <span>VENDEDOR</span>
        <strong>{reservation.share.createdBy.name}</strong>
      </div>
      <div className="reservation-card-items">
        <span>{reservation.items.length} {reservation.items.length === 1 ? 'chapa' : 'chapas'}</span>
        <p>{bundleCodes.join(' · ') || 'Sem bundles'}</p>
      </div>
    </button>
  )
}

function ReservationDetailsDialog({
  reservation,
  onClose,
}: {
  reservation: ReservationDetails
  onClose: () => void
}) {
  const itemsByBundle = reservation.items.reduce((groups, item) => {
    const bundleId = item.slab.bundle.id
    const existing = groups.get(bundleId) ?? []
    existing.push(item)
    groups.set(bundleId, existing)
    return groups
  }, new Map<number, ReservationDetails['items']>())

  return (
    <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="reservation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
      >
        <button className="reservation-dialog-close" type="button" onClick={onClose} aria-label="Fechar detalhes da reserva">
          ×
        </button>
        <div className="reservation-detail-heading">
          <div>
            <p className="eyebrow">DETALHES DA SOLICITAÇÃO</p>
            <h2 id="reservation-detail-title">Reserva #{reservation.id}</h2>
          </div>
          <span className={`reservation-status reservation-${reservation.status.toLowerCase()}`}>
            {getReservationStatus(reservation.status)}
          </span>
        </div>

        <div className="reservation-detail-grid">
          <section className="reservation-detail-section">
            <h3>Cliente</h3>
            <dl>
              <div><dt>Nome</dt><dd>{reservation.share.client.name}</dd></div>
              <div><dt>E-mail</dt><dd>{reservation.share.client.email || 'Não informado'}</dd></div>
              <div><dt>Telefone</dt><dd>{reservation.share.client.phone || 'Não informado'}</dd></div>
              <div><dt>Documento</dt><dd>{reservation.share.client.document || 'Não informado'}</dd></div>
            </dl>
          </section>
          <section className="reservation-detail-section">
            <h3>Solicitação</h3>
            <dl>
              <div><dt>Vendedor</dt><dd>{reservation.share.createdBy.name}</dd></div>
              <div><dt>Share</dt><dd>{reservation.share.title || `Share #${reservation.share.id}`}</dd></div>
              <div><dt>Recebida em</dt><dd>{formatDateTime(reservation.createdAt)}</dd></div>
              <div><dt>Atualizada em</dt><dd>{formatDateTime(reservation.updatedAt)}</dd></div>
            </dl>
          </section>
        </div>

        <section className="reservation-message-section">
          <h3>Mensagem do cliente</h3>
          <p>{reservation.message || 'Nenhuma mensagem enviada.'}</p>
        </section>

        <section className="reservation-bundles-section">
          <header>
            <div>
              <p className="eyebrow">ITENS SOLICITADOS</p>
              <h3>Bundles e slabs</h3>
            </div>
            <span>{reservation.items.length} {reservation.items.length === 1 ? 'chapa' : 'chapas'}</span>
          </header>
          {[...itemsByBundle.entries()].map(([bundleId, items]) => {
            const bundle = items[0].slab.bundle
            return (
              <article className="reservation-bundle-group" key={bundleId}>
                <div className="reservation-bundle-heading">
                  <div>
                    <h4>{bundle.bundleCode}</h4>
                    <p>{bundle.material.name} · {bundle.finish.name}</p>
                  </div>
                  <span>{items.length} {items.length === 1 ? 'chapa' : 'chapas'}</span>
                </div>
                <div className="reservation-slab-list">
                  {items.map(({ slab }) => (
                    <div className="reservation-slab-row" key={slab.id}>
                      <strong>Chapa {String(slab.number).padStart(2, '0')}</strong>
                      <span>{formatMeasure(slab.length, ' cm')} × {formatMeasure(slab.height, ' cm')}</span>
                      <span>{formatMeasure(slab.area, ' m²')}</span>
                      <span className={`slab-state slab-state-${slab.status.toLowerCase()}`}>
                        {slab.status === 'AVAILABLE' ? 'Disponível' : slab.status === 'RESERVED' ? 'Reservada' : slab.status}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </section>
      </section>
    </div>
  )
}

export function SalesPipelinePage({ companyId }: SalesPipelinePageProps) {
  const [shares, setShares] = useState<ShareOffer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState<ReservationSummary[]>([])
  const [areReservationsLoading, setAreReservationsLoading] = useState(false)
  const [reservationsError, setReservationsError] = useState('')
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null)
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null)
  const [isLoadingReservationDetails, setIsLoadingReservationDetails] = useState(false)
  const [reservationDetailsError, setReservationDetailsError] = useState('')
  const [draggedShare, setDraggedShare] = useState<ShareOffer | null>(null)
  const [isReservationsDropActive, setIsReservationsDropActive] = useState(false)
  const [shareForReservation, setShareForReservation] = useState<ShareOffer | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) return

    let active = true
    setIsLoading(true)
    setError('')

    void getShares(token)
      .then((offers) => {
        if (active) setShares(Array.isArray(offers) ? offers : [])
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar as ofertas.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [companyId])

  useEffect(() => {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) return

    let active = true
    setAreReservationsLoading(true)
    setReservationsError('')

    void getReservations(token)
      .then((result) => {
        if (active) setReservations(Array.isArray(result) ? result : [])
      })
      .catch((requestError: unknown) => {
        if (active) {
          setReservationsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar as reservas.')
        }
      })
      .finally(() => {
        if (active) setAreReservationsLoading(false)
      })

    return () => {
      active = false
    }
  }, [companyId])

  useEffect(() => {
    if (selectedReservationId === null) {
      setReservationDetails(null)
      setReservationDetailsError('')
      return
    }

    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setReservationDetailsError('Sua sessão expirou. Entre novamente para ver os detalhes.')
      return
    }

    let active = true
    setReservationDetails(null)
    setReservationDetailsError('')
    setIsLoadingReservationDetails(true)

    void getReservation(token, selectedReservationId)
      .then((details) => {
        if (active) setReservationDetails(details)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setReservationDetailsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os detalhes da reserva.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingReservationDetails(false)
      })

    return () => {
      active = false
    }
  }, [companyId, selectedReservationId])

  function handleOfferDragStart(share: ShareOffer) {
    setDraggedShare(share)
  }

  function handleOfferDragEnd() {
    setDraggedShare(null)
    setIsReservationsDropActive(false)
  }

  function handleReservationsDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsReservationsDropActive(false)
    const token = event.dataTransfer.getData('text/plain')
    const share = shares.find((offer) => offer.token === token) ?? draggedShare
    if (share) setShareForReservation(share)
    setDraggedShare(null)
  }

  async function refreshReservations() {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) return
    try {
      const result = await getReservations(token)
      setReservations(Array.isArray(result) ? result : [])
      setReservationsError('')
    } catch (requestError) {
      setReservationsError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível atualizar as reservas.')
    }
  }

  return (
    <>
      <main className="board-main" id="sales-pipeline">

        <section className="kanban-scroll" aria-label="Quadro Kanban de vendas">
          <div className="kanban-board">
            {BOARD_COLUMNS.map((column) => {
              const columnShares = column.key === 'offers' ? shares : []
              const columnReservations = column.key === 'reservations' ? reservations : []
              const count = column.key === 'offers'
                ? shares.length
                : column.key === 'reservations'
                  ? reservations.length
                  : 0

              return (
                <section
                  className={`kanban-column column-${column.key}${column.key === 'reservations' && isReservationsDropActive ? ' is-drop-active' : ''}`}
                  key={column.key}
                  onDragOver={column.key === 'reservations' && draggedShare ? (event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'copy'
                    setIsReservationsDropActive(true)
                  } : undefined}
                  onDragLeave={column.key === 'reservations' ? (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setIsReservationsDropActive(false)
                    }
                  } : undefined}
                  onDrop={column.key === 'reservations' ? handleReservationsDrop : undefined}
                >
                  <header className="column-heading">
                    <div>
                      <h2>{column.title}</h2>
                      <p>{column.description}</p>
                    </div>
                    <span className="column-count" aria-label={`${count} itens`}>
                        {column.key === 'offers' && isLoading
                          || column.key === 'reservations' && areReservationsLoading
                          ? '…'
                          : count}
                    </span>
                  </header>

                  <div className="column-cards">
                    {column.key === 'reservations' && isReservationsDropActive && (
                      <div className="reservation-drop-hint" aria-live="polite">
                        Solte a oferta para escolher as slabs
                      </div>
                    )}
                    {column.key === 'offers' && error && (
                      <p className="column-error" role="alert">{error}</p>
                    )}
                    {column.key === 'offers' && isLoading && shares.length === 0 && (
                      <p className="column-loading" aria-live="polite">Carregando ofertas...</p>
                    )}
                    {columnShares.map((share) => (
                      <OfferCard
                        key={share.id}
                        share={share}
                        onDragStart={handleOfferDragStart}
                        onDragEnd={handleOfferDragEnd}
                      />
                    ))}
                    {column.key === 'reservations' && reservationsError && (
                      <p className="column-error" role="alert">{reservationsError}</p>
                    )}
                    {column.key === 'reservations' && areReservationsLoading && reservations.length === 0 && (
                      <p className="column-loading" aria-live="polite">Carregando reservas...</p>
                    )}
                    {columnReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onOpen={setSelectedReservationId}
                      />
                    ))}
                    {column.key !== 'offers' && column.key !== 'reservations' && (
                      <div className={`column-empty empty-${column.key}`}>
                        <span className="empty-mark" aria-hidden="true">
                          {column.key === 'invoices' ? '—' : '+'}
                        </span>
                        <p>{column.emptyMessage}</p>
                      </div>
                    )}
                    {column.key === 'offers' && !isLoading && !error && shares.length === 0 && (
                      <div className="column-empty empty-offers">
                        <span className="empty-mark" aria-hidden="true">+</span>
                        <p>{column.emptyMessage}</p>
                      </div>
                    )}
                    {column.key === 'reservations' && !areReservationsLoading && !reservationsError && reservations.length === 0 && (
                      <div className="column-empty empty-reservations">
                        <span className="empty-mark" aria-hidden="true">+</span>
                        <p>{column.emptyMessage}</p>
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      </main>
      {selectedReservationId !== null && (
        <>
          {isLoadingReservationDetails && (
            <div className="reservation-dialog-backdrop">
              <section className="reservation-dialog reservation-dialog-state" role="dialog" aria-modal="true" aria-label="Carregando reserva">
                <p aria-live="polite">Carregando detalhes da reserva...</p>
              </section>
            </div>
          )}
          {reservationDetailsError && (
            <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedReservationId(null)
            }}>
              <section className="reservation-dialog reservation-dialog-state" role="dialog" aria-modal="true" aria-label="Erro ao carregar reserva">
                <button className="reservation-dialog-close" type="button" onClick={() => setSelectedReservationId(null)} aria-label="Fechar">
                  ×
                </button>
                <p className="column-error" role="alert">{reservationDetailsError}</p>
              </section>
            </div>
          )}
          {reservationDetails && (
            <ReservationDetailsDialog
              reservation={reservationDetails}
              onClose={() => setSelectedReservationId(null)}
            />
          )}
        </>
      )}
      {shareForReservation && (
        <ReservationFromShareDialog
          share={shareForReservation}
          onClose={() => setShareForReservation(null)}
          onCreated={() => void refreshReservations()}
        />
      )}
    </>
  )
}