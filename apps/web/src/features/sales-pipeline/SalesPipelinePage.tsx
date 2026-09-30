import { useEffect, useState } from 'react'
import type { DragEvent } from 'react'
import { getShares } from './sales-pipeline.api'
import { approveReservation, createReservationRequest, getReservation, getReservations, rejectReservation } from './reservations.api'
import type { ReservationDetails, ReservationStatus, ReservationSummary } from './reservations.api'
import type { BoardColumn, ShareOffer } from './sales-pipeline.types'
import { getNegotiation, getNegotiations, updateNegotiation, uploadNegotiationFile } from './negotiations.api'
import type { NegotiationFields, NegotiationSummary } from './negotiations.api'
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
    title: 'Em Negociação',
    description: 'Reservas aprovadas em negociação',
    emptyMessage: 'As negociações aparecerão aqui.',
  },
  {
    key: 'waiting_booking',
    title: 'Aguardando Booking',
    description: 'Negociações aguardando booking',
    emptyMessage: 'Nenhuma negociação aguardando booking.',
  },
  {
    key: 'already_booked',
    title: 'Já Reservado',
    description: 'Etapa sugerida',
    emptyMessage: 'Espaço reservado para esta etapa.',
  },
  {
    key: 'completed',
    title: 'Concluídas',
    description: 'Vendas concluídas',
    emptyMessage: 'As vendas concluídas aparecerão aqui.',
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
          {share.status === 'ACTIVE' ? 'Ativa' : share.status === 'EXPIRED' ? 'Expirada' : 'Inativa'}
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
  onDragStart,
  onDragEnd,
}: {
  reservation: ReservationSummary
  onOpen: (reservationId: number) => void
  onDragStart: (reservationId: number) => void
  onDragEnd: () => void
}) {
  const bundleCodes = [...new Set(reservation.items.map(({ slab }) => slab.bundle.bundleCode))]

  return (
    <button
      className="reservation-card"
      type="button"
      draggable={reservation.status === 'PENDING'}
      onClick={() => onOpen(reservation.id)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(reservation.id))
        onDragStart(reservation.id)
      }}
      onDragEnd={onDragEnd}
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
  onApprove,
  onReject,
}: {
  reservation: ReservationDetails
  onClose: () => void
  onApprove: (reservationId: number) => Promise<void>
  onReject: (reservationId: number) => Promise<void>
}) {
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)
  const [actionError, setActionError] = useState('')
  const itemsByBundle = reservation.items.reduce((groups, item) => {
    const bundleId = item.slab.bundle.id
    const existing = groups.get(bundleId) ?? []
    existing.push(item)
    groups.set(bundleId, existing)
    return groups
  }, new Map<number, ReservationDetails['items']>())

  async function decide(action: 'approve' | 'reject') {
    setPendingAction(action)
    setActionError('')
    try {
      await (action === 'approve' ? onApprove : onReject)(reservation.id)
      onClose()
    } catch (requestError) {
      setActionError(requestError instanceof Error
        ? requestError.message
        : `Não foi possível ${action === 'approve' ? 'aprovar' : 'rejeitar'} a reserva.`)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && pendingAction === null) onClose()
    }}>
      <section
        className="reservation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
      >
        <button className="reservation-dialog-close" type="button" onClick={onClose} aria-label="Fechar detalhes da reserva" disabled={pendingAction !== null}>
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
        {reservation.status === 'PENDING' && (
          <footer className="reservation-decision-actions">
            {actionError && <p className="column-error" role="alert">{actionError}</p>}
            <div>
              <button
                className="reservation-reject-button"
                type="button"
                onClick={() => void decide('reject')}
                disabled={pendingAction !== null}
              >
                {pendingAction === 'reject' ? 'Rejeitando...' : 'Rejeitar reserva'}
              </button>
              <button
                className="reservation-submit-button"
                type="button"
                onClick={() => void decide('approve')}
                disabled={pendingAction !== null}
              >
                {pendingAction === 'approve' ? 'Aprovando...' : 'Aprovar reserva'}
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  )
}

function NegotiationCard({
  negotiation,
  onOpen,
}: {
  negotiation: NegotiationSummary
  onOpen: (negotiationId: number) => void
}) {
  const client = negotiation.reservationRequest.share.client
  const bundleCodes = [...new Set(negotiation.reservationRequest.items.map(({ slab }) => slab.bundle.bundleCode))]

  return (
    <button
      className="negotiation-card"
      type="button"
      onClick={() => onOpen(negotiation.id)}
      aria-label={`Abrir negociação ${negotiation.id} de ${client.name}`}
    >
      <div className="negotiation-card-topline">
        <span>Negociação #{negotiation.id}</span>
      </div>
      <h3>{client.name}</h3>
      <div className="reservation-card-person">
        <span>RESERVA</span>
        <strong>#{negotiation.reservationRequestId}</strong>
      </div>
      <div className="reservation-card-items">
        <span>{negotiation.reservationRequest.items.length} {negotiation.reservationRequest.items.length === 1 ? 'chapa' : 'chapas'}</span>
        <p>{bundleCodes.join(' · ') || 'Sem bundles'}</p>
      </div>
      {negotiation.files && negotiation.files.length > 0 && (
        <span className="negotiation-file-count">{negotiation.files.length} anexo(s)</span>
      )}
    </button>
  )
}

type NegotiationForm = Omit<NegotiationFields, 'truckingFee' | 'oceanFreight'> & {
  truckingFee: string
  oceanFreight: string
}

function NegotiationDetailsDialog({
  negotiation,
  onClose,
  onSave,
}: {
  negotiation: NegotiationSummary
  onClose: () => void
  onSave: (fields: NegotiationFields, comment: string, files: File[]) => Promise<void>
}) {
  const [form, setForm] = useState<NegotiationForm>(() => ({
    paymentTerms: negotiation.paymentTerms ?? '',
    portOfLoading: negotiation.portOfLoading ?? '',
    portOfDestination: negotiation.portOfDestination ?? '',
    shippingMethod: negotiation.shippingMethod ?? '',
    incoterm: negotiation.incoterm ?? '',
    containerType: negotiation.containerType ?? '',
    deliveryTime: negotiation.deliveryTime ?? '',
    truckingFee: negotiation.truckingFee?.toString() ?? '',
    oceanFreight: negotiation.oceanFreight?.toString() ?? '',
    invoice: negotiation.invoice ?? '',
    packingInfo: negotiation.packingInfo ?? '',
    remarks: negotiation.remarks ?? '',
  }))
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditable = negotiation.status === 'IN_NEGOTIATION'

  useEffect(() => {
    setForm({
      paymentTerms: negotiation.paymentTerms ?? '',
      portOfLoading: negotiation.portOfLoading ?? '',
      portOfDestination: negotiation.portOfDestination ?? '',
      shippingMethod: negotiation.shippingMethod ?? '',
      incoterm: negotiation.incoterm ?? '',
      containerType: negotiation.containerType ?? '',
      deliveryTime: negotiation.deliveryTime ?? '',
      truckingFee: negotiation.truckingFee?.toString() ?? '',
      oceanFreight: negotiation.oceanFreight?.toString() ?? '',
      invoice: negotiation.invoice ?? '',
      packingInfo: negotiation.packingInfo ?? '',
      remarks: negotiation.remarks ?? '',
    })
  }, [negotiation])
  const requiredFields = [
    form.paymentTerms,
    form.portOfLoading,
    form.portOfDestination,
    form.shippingMethod,
    form.incoterm,
    form.containerType,
    form.deliveryTime,
    form.truckingFee,
    form.oceanFreight,
  ]
  const completedFields = requiredFields.filter((value) => value.trim() !== '').length

  function updateField(field: keyof NegotiationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit() {
    setError('')
    setIsSubmitting(true)
    try {
      const truckingFee = form.truckingFee.trim() ? Number(form.truckingFee.replace(',', '.')) : null
      const oceanFreight = form.oceanFreight.trim() ? Number(form.oceanFreight.replace(',', '.')) : null
      if ((truckingFee !== null && !Number.isFinite(truckingFee)) || (oceanFreight !== null && !Number.isFinite(oceanFreight))) {
        setError('Informe valores numéricos válidos para os fretes.')
        return
      }
      await onSave({
        ...form,
        truckingFee,
        oceanFreight,
      }, comment, files)
      setFiles([])
      setComment('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar as alterações.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const textField = (field: keyof NegotiationForm, label: string, required = false) => (
    <label className="negotiation-field" key={field}>
      <span>{label}{required && <small>Obrigatório</small>}</span>
      <input
        type={field === 'truckingFee' || field === 'oceanFreight' ? 'number' : 'text'}
        step={field === 'truckingFee' || field === 'oceanFreight' ? '0.01' : undefined}
        value={form[field]}
        onChange={(event) => updateField(field, event.target.value)}
        disabled={!isEditable || isSubmitting}
      />
    </label>
  )

  return (
    <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose()
    }}>
      <section className="reservation-dialog negotiation-dialog" role="dialog" aria-modal="true" aria-labelledby="negotiation-title">
        <button className="reservation-dialog-close" type="button" onClick={onClose} aria-label="Fechar negociação" disabled={isSubmitting}>×</button>
        <header className="reservation-detail-heading">
          <div>
            <p className="eyebrow">RESERVA #{negotiation.reservationRequestId}</p>
            <h2 id="negotiation-title">{negotiation.reservationRequest.share.client.name}</h2>
          </div>
        </header>

        <section className="negotiation-form-section">
          <div className="negotiation-section-heading">
            <div>
              <h3>Condições comerciais</h3>
              <p>{completedFields}/9 campos preenchidos para avançar para booking</p>
            </div>
          </div>
          <div className="negotiation-field-grid">
            {textField('paymentTerms', 'Condições de pagamento', true)}
            {textField('portOfLoading', 'Porto de embarque', true)}
            {textField('portOfDestination', 'Porto de destino', true)}
            {textField('shippingMethod', 'Modal de envio', true)}
            {textField('incoterm', 'Incoterm', true)}
            {textField('containerType', 'Tipo de container', true)}
            {textField('deliveryTime', 'Prazo de entrega', true)}
            {textField('truckingFee', 'Frete terrestre', true)}
            {textField('oceanFreight', 'Frete marítimo', true)}
            {textField('invoice', 'Fatura')}
            {textField('packingInfo', 'Informações de embalagem')}
          </div>
          <label className="negotiation-field negotiation-field-wide">
            <span>Informações e observações</span>
            <textarea rows={3} value={form.remarks} onChange={(event) => updateField('remarks', event.target.value)} disabled={!isEditable || isSubmitting} />
          </label>
        </section>

        <section className="negotiation-form-section">
          <h3>Arquivos</h3>
          {negotiation.files && negotiation.files.length > 0 ? (
            <ul className="negotiation-file-list">
              {negotiation.files.map((file) => (
                <li key={file.id}><a href={file.url} target="_blank" rel="noreferrer">{file.fileName}</a></li>
              ))}
            </ul>
          ) : <p className="negotiation-muted">Nenhum arquivo anexado.</p>}
          {isEditable && (
            <label className="negotiation-file-picker">
              <span>Anexar arquivos</span>
              <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} disabled={isSubmitting} />
              {files.length > 0 && <small>{files.map((file) => file.name).join(', ')}</small>}
            </label>
          )}
        </section>

        {isEditable && (
          <section className="negotiation-form-section">
            <h3>Adicionar comentário</h3>
            <label className="negotiation-field negotiation-field-wide">
              <span>Novo comentário</span>
              <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} disabled={isSubmitting} placeholder="Registre uma atualização da negociação" />
            </label>
          </section>
        )}

        {error && <p className="column-error" role="alert">{error}</p>}
        {isEditable && (
          <footer className="negotiation-dialog-footer">
            <span>As alterações são salvas na negociação.</span>
            <button className="reservation-submit-button" type="button" onClick={() => void submit()} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </footer>
        )}
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
  const [negotiations, setNegotiations] = useState<NegotiationSummary[]>([])
  const [areNegotiationsLoading, setAreNegotiationsLoading] = useState(false)
  const [negotiationsError, setNegotiationsError] = useState('')
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<number | null>(null)
  const [negotiationDetails, setNegotiationDetails] = useState<NegotiationSummary | null>(null)
  const [isLoadingNegotiationDetails, setIsLoadingNegotiationDetails] = useState(false)
  const [negotiationDetailsError, setNegotiationDetailsError] = useState('')
  const [draggedShare, setDraggedShare] = useState<ShareOffer | null>(null)
  const [draggedReservationId, setDraggedReservationId] = useState<number | null>(null)
  const [isReservationsDropActive, setIsReservationsDropActive] = useState(false)
  const [isNegotiationDropActive, setIsNegotiationDropActive] = useState(false)
  const [approvingReservationId, setApprovingReservationId] = useState<number | null>(null)
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
    setAreNegotiationsLoading(true)
    setNegotiationsError('')

    void getNegotiations(token)
      .then((result) => {
        if (active) setNegotiations(Array.isArray(result) ? result : [])
      })
      .catch((requestError: unknown) => {
        if (active) {
          setNegotiationsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar as negociações.')
        }
      })
      .finally(() => {
        if (active) setAreNegotiationsLoading(false)
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

  useEffect(() => {
    if (selectedNegotiationId === null) {
      setNegotiationDetails(null)
      setNegotiationDetailsError('')
      return
    }

    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setNegotiationDetailsError('Sua sessão expirou. Entre novamente para ver os detalhes.')
      return
    }

    let active = true
    setNegotiationDetails(null)
    setNegotiationDetailsError('')
    setIsLoadingNegotiationDetails(true)

    void getNegotiation(token, selectedNegotiationId)
      .then((details) => {
        if (active) setNegotiationDetails(details)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setNegotiationDetailsError(requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os detalhes da negociação.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingNegotiationDetails(false)
      })

    return () => {
      active = false
    }
  }, [companyId, selectedNegotiationId])

  function handleOfferDragStart(share: ShareOffer) {
    setDraggedShare(share)
  }

  function handleOfferDragEnd() {
    setDraggedShare(null)
    setIsReservationsDropActive(false)
  }

  function handleReservationDragStart(reservationId: number) {
    setDraggedReservationId(reservationId)
  }

  function handleReservationDragEnd() {
    setDraggedReservationId(null)
    setIsNegotiationDropActive(false)
  }

  function handleReservationsDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsReservationsDropActive(false)
    const token = event.dataTransfer.getData('text/plain')
    const share = shares.find((offer) => offer.token === token) ?? draggedShare
    if (share) setShareForReservation(share)
    setDraggedShare(null)
  }

  async function handleNegotiationDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsNegotiationDropActive(false)
    const reservationId = Number(event.dataTransfer.getData('text/plain')) || draggedReservationId
    setDraggedReservationId(null)
    if (!reservationId || approvingReservationId !== null) return

    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setNegotiationsError('Sua sessão expirou. Entre novamente para aprovar a reserva.')
      return
    }

    setApprovingReservationId(reservationId)
    setNegotiationsError('')
    try {
      await approveReservation(token, reservationId)
      const updatedNegotiations = await getNegotiations(token)
      const negotiationList = Array.isArray(updatedNegotiations) ? updatedNegotiations : []
      setNegotiations(negotiationList)
      const createdNegotiation = negotiationList.find((item) => item.reservationRequestId === reservationId)
      if (!createdNegotiation) {
        throw new Error('A reserva foi aprovada, mas a negociação não apareceu na listagem.')
      }
      setSelectedNegotiationId(createdNegotiation.id)
      try {
        const updatedReservations = await getReservations(token)
        setReservations(Array.isArray(updatedReservations) ? updatedReservations : [])
      } catch (requestError) {
        setReservationsError(requestError instanceof Error
          ? requestError.message
          : 'A reserva foi aprovada, mas não foi possível atualizar a lista.')
      }
    } catch (requestError) {
      setNegotiationsError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível aprovar a reserva e iniciar a negociação.')
    } finally {
      setApprovingReservationId(null)
    }
  }

  async function saveNegotiation(fields: NegotiationFields, comment: string, files: File[]) {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token || selectedNegotiationId === null) {
      throw new Error('Sua sessão expirou. Entre novamente para salvar.')
    }

    const trimmedComment = comment.trim()
    const remarks = trimmedComment
      ? [
          fields.remarks.trim(),
          `Comentário (${formatDateTime(new Date().toISOString())}): ${trimmedComment}`,
        ].filter(Boolean).join('\n\n')
      : fields.remarks.trim()

    await updateNegotiation(token, selectedNegotiationId, { ...fields, remarks })
    for (const file of files) {
      await uploadNegotiationFile(token, selectedNegotiationId, file)
    }
    const [details, updatedNegotiations] = await Promise.all([
      getNegotiation(token, selectedNegotiationId),
      getNegotiations(token),
    ])
    setNegotiationDetails(details)
    setNegotiations(Array.isArray(updatedNegotiations) ? updatedNegotiations : [])
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

  async function refreshNegotiations() {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) return
    try {
      const result = await getNegotiations(token)
      setNegotiations(Array.isArray(result) ? result : [])
      setNegotiationsError('')
    } catch (requestError) {
      setNegotiationsError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível atualizar as negociações.')
    }
  }

  async function handleReservationApproval(reservationId: number) {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para aprovar a reserva.')
    await approveReservation(token, reservationId)
    await Promise.all([refreshReservations(), refreshNegotiations()])
  }

  async function handleReservationRejection(reservationId: number) {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para rejeitar a reserva.')
    await rejectReservation(token, reservationId)
    await refreshReservations()
  }

  return (
    <>
      <main className="board-main" id="sales-pipeline">

        <section className="kanban-scroll" aria-label="Quadro Kanban de vendas">
          <div className="kanban-board">
            {BOARD_COLUMNS.map((column) => {
              const columnShares = column.key === 'offers' ? shares : []
              const columnReservations = column.key === 'reservations'
                ? reservations.filter((reservation) => reservation.status === 'PENDING')
                : []
              const columnNegotiations = column.key === 'negotiation'
                ? negotiations.filter((negotiation) => negotiation.status === 'IN_NEGOTIATION')
                : column.key === 'waiting_booking'
                  ? negotiations.filter((negotiation) => negotiation.status === 'AWAITING_BOOKING')
                  : []
              const count = column.key === 'offers'
                ? shares.length
                : column.key === 'reservations'
                  ? columnReservations.length
                    : column.key === 'negotiation' || column.key === 'waiting_booking'
                      ? columnNegotiations.length
                    : 0

              return (
                <section
                  className={`kanban-column column-${column.key}${(column.key === 'reservations' && isReservationsDropActive) || (column.key === 'negotiation' && isNegotiationDropActive) ? ' is-drop-active' : ''}`}
                  key={column.key}
                  onDragOver={column.key === 'negotiation' && draggedReservationId !== null ? (event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    setIsNegotiationDropActive(true)
                  } : column.key === 'reservations' && draggedShare ? (event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'copy'
                    setIsReservationsDropActive(true)
                  } : undefined}
                  onDragLeave={column.key === 'negotiation' ? (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setIsNegotiationDropActive(false)
                    }
                  } : undefined}
                  onDrop={column.key === 'negotiation' && draggedReservationId !== null
                    ? handleNegotiationDrop
                    : column.key === 'reservations' && draggedShare
                      ? handleReservationsDrop
                      : undefined}
                >
                  <header className="column-heading">
                    <div>
                      <h2>{column.title}</h2>
                      <p>{column.description}</p>
                    </div>
                    <span className="column-count" aria-label={`${count} itens`}>
                        {column.key === 'offers' && isLoading
                          || column.key === 'reservations' && areReservationsLoading
                          || (column.key === 'negotiation' || column.key === 'waiting_booking') && areNegotiationsLoading
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
                    {column.key === 'negotiation' && isNegotiationDropActive && (
                      <div className="reservation-drop-hint" aria-live="polite">
                        Solte para aprovar a reserva e abrir a negociação
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
                    {(column.key === 'negotiation' || column.key === 'waiting_booking') && negotiationsError && (
                      <p className="column-error" role="alert">{negotiationsError}</p>
                    )}
                    {(column.key === 'negotiation' || column.key === 'waiting_booking') && areNegotiationsLoading && columnNegotiations.length === 0 && (
                      <p className="column-loading" aria-live="polite">Carregando negociações...</p>
                    )}
                    {columnReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onOpen={setSelectedReservationId}
                        onDragStart={handleReservationDragStart}
                        onDragEnd={handleReservationDragEnd}
                      />
                    ))}
                    {columnNegotiations.map((negotiation) => (
                      <NegotiationCard
                        key={negotiation.id}
                        negotiation={negotiation}
                        onOpen={setSelectedNegotiationId}
                      />
                    ))}
                    {column.key !== 'offers' && column.key !== 'reservations' && column.key !== 'negotiation' && column.key !== 'waiting_booking' && (
                      <div className={`column-empty empty-${column.key}`}>
                        <span className="empty-mark" aria-hidden="true">
                          {column.key === 'completed' ? '—' : '+'}
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
                    {column.key === 'reservations' && !areReservationsLoading && !reservationsError && columnReservations.length === 0 && (
                      <div className="column-empty empty-reservations">
                        <span className="empty-mark" aria-hidden="true">+</span>
                        <p>{column.emptyMessage}</p>
                      </div>
                    )}
                    {(column.key === 'negotiation' || column.key === 'waiting_booking') && !areNegotiationsLoading && !negotiationsError && columnNegotiations.length === 0 && (
                      <div className={`column-empty empty-${column.key}`}>
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
              onApprove={handleReservationApproval}
              onReject={handleReservationRejection}
            />
          )}
        </>
      )}
      {selectedNegotiationId !== null && (
        <>
          {isLoadingNegotiationDetails && (
            <div className="reservation-dialog-backdrop">
              <section className="reservation-dialog reservation-dialog-state" role="dialog" aria-modal="true" aria-label="Carregando negociação">
                <p aria-live="polite">Carregando detalhes da negociação...</p>
              </section>
            </div>
          )}
          {negotiationDetailsError && (
            <div className="reservation-dialog-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedNegotiationId(null)
            }}>
              <section className="reservation-dialog reservation-dialog-state" role="dialog" aria-modal="true" aria-label="Erro ao carregar negociação">
                <button className="reservation-dialog-close" type="button" onClick={() => setSelectedNegotiationId(null)} aria-label="Fechar">×</button>
                <p className="column-error" role="alert">{negotiationDetailsError}</p>
              </section>
            </div>
          )}
          {negotiationDetails && (
            <NegotiationDetailsDialog
              key={negotiationDetails.id}
              negotiation={negotiationDetails}
              onClose={() => setSelectedNegotiationId(null)}
              onSave={saveNegotiation}
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