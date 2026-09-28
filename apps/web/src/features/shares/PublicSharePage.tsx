import { useEffect, useState } from 'react'
import { AppFooter } from '../../app/AppShell'
import { createPublicReservationRequest, getPublicShare } from './shares.api'
import type { PublicShareBundle } from './shares.api'
import './PublicSharePage.css'

type PublicSharePageProps = {
  token: string
}

function formatValue(value: number | string | null, unit = '') {
  if (value === null) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${number.toLocaleString('pt-BR')}${unit}`
}

function formatCurrency(value: number | string | null) {
  if (value === null) return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getSlabStatus(status: string) {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponível',
    RESERVED: 'Reservada',
    SOLD: 'Vendida',
    INACTIVE: 'Indisponível',
  }
  return labels[status] ?? status
}

function PublicBundleCard({
  bundle,
  index,
  isSelectionEnabled,
  selectedSlabIds,
  onToggleSlab,
  onToggleBundle,
}: {
  bundle: PublicShareBundle
  index: number
  isSelectionEnabled: boolean
  selectedSlabIds: number[]
  onToggleSlab: (slabId: number) => void
  onToggleBundle: (bundleId: number) => void
}) {
  const cover = bundle.images.find((image) => image.isPrimary) ?? bundle.images[0]
  const price = formatCurrency(bundle.basePrice)
  const availableSlabs = bundle.slabs.filter((slab) => slab.status === 'AVAILABLE')
  const availableSlabCount = availableSlabs.length
  const selectedSlabCount = availableSlabs.filter((slab) => selectedSlabIds.includes(slab.id)).length
  const allAvailableSelected = availableSlabCount > 0 && selectedSlabCount === availableSlabCount

  return (
    <article className="public-bundle-card">
      <header className="public-bundle-heading">
        <span className="public-bundle-index">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <p>{bundle.material.name}</p>
          <h2>{bundle.bundleCode}</h2>
        </div>
        <span className="public-bundle-slab-count">
          {availableSlabCount} <small>chapas disponíveis</small>
        </span>
        {isSelectionEnabled && (
          <label className="public-bundle-select-control">
            <input
              type="checkbox"
              checked={allAvailableSelected}
              disabled={availableSlabCount === 0}
              onChange={() => onToggleBundle(bundle.id)}
              aria-label={`Selecionar todas as chapas disponíveis de ${bundle.bundleCode}`}
            />
            <span>Selecionar bundle</span>
          </label>
        )}
      </header>

      <div className="public-bundle-overview">
        <div className="public-bundle-gallery">
          {cover ? (
            <img className="public-bundle-cover" src={cover.url} alt={bundle.material.name} />
          ) : (
            <div className="public-bundle-cover public-image-placeholder" aria-label="Sem imagem disponível">
              {bundle.material.name}
            </div>
          )}
          {bundle.images.length > 1 && (
            <div className="public-bundle-thumbnails">
              {bundle.images.slice(0, 4).map((image) => (
                <img key={image.id} src={image.url} alt="" />
              ))}
              {bundle.images.length > 4 && <span>+{bundle.images.length - 4}</span>}
            </div>
          )}
        </div>

        <div className="public-bundle-info">
          <p className="public-bundle-description">
            {bundle.materialType.name} · {bundle.materialClassification.name}
          </p>
          {bundle.material.description && <p className="public-material-note">{bundle.material.description}</p>}
          <dl className="public-bundle-facts">
            <div><dt>Espessura</dt><dd>{formatValue(bundle.thickness, ' mm')}</dd></div>
            <div><dt>Peso do bundle</dt><dd>{formatValue(bundle.weight, ' kg')}</dd></div>
            <div><dt>Qualidade</dt><dd>{bundle.quality.name}</dd></div>
            <div><dt>Acabamento</dt><dd>{bundle.finish.name}</dd></div>
            {bundle.block && <div><dt>Bloco</dt><dd>{bundle.block}</dd></div>}
            {bundle.location && <div><dt>Localização</dt><dd>{bundle.location}</dd></div>}
          </dl>
          {price && <p className="public-bundle-price"><span>Valor de referência</span><strong>{price}</strong></p>}
        </div>
      </div>

      <section className="public-slabs" aria-label={`Chapas do bundle ${bundle.bundleCode}`}>
        <header className="public-slabs-heading">
          <div>
            <p className="public-section-label">NO BUNDLE</p>
            <h3>Chapas disponíveis</h3>
          </div>
          <span>{bundle.slabs.length} {bundle.slabs.length === 1 ? 'chapa' : 'chapas'}</span>
        </header>
        {bundle.slabs.length > 0 ? (
          <div className="public-slab-grid">
            {bundle.slabs.map((slab) => {
              const slabImage = slab.images[0]
              return (
                <article
                  className={`public-slab-card${selectedSlabIds.includes(slab.id) ? ' is-selected' : ''}${isSelectionEnabled && slab.status !== 'AVAILABLE' ? ' is-unavailable' : ''}`}
                  key={slab.id}
                >
                  {slabImage ? (
                    <img src={slabImage.url} alt={`Chapa ${slab.number}`} />
                  ) : (
                    <div className="public-slab-image-placeholder" aria-hidden="true">{String(slab.number).padStart(2, '0')}</div>
                  )}
                  <div className="public-slab-content">
                    <header>
                      <h4>Chapa {String(slab.number).padStart(2, '0')}</h4>
                      {isSelectionEnabled && (
                        <input
                          className="public-slab-checkbox"
                          type="checkbox"
                          checked={selectedSlabIds.includes(slab.id)}
                          disabled={slab.status !== 'AVAILABLE'}
                          onChange={() => onToggleSlab(slab.id)}
                          aria-label={`Selecionar chapa ${slab.number} do bundle ${bundle.bundleCode}`}
                        />
                      )}
                      <span className={`public-slab-status slab-${slab.status.toLocaleLowerCase()}`}>
                        {getSlabStatus(slab.status)}
                      </span>
                    </header>
                    <dl>
                      <div><dt>Comprimento</dt><dd>{formatValue(slab.length, ' cm')}</dd></div>
                      <div><dt>Altura</dt><dd>{formatValue(slab.height, ' cm')}</dd></div>
                      <div><dt>Área</dt><dd>{formatValue(slab.area, ' m²')}</dd></div>
                    </dl>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="public-slabs-empty">Nenhuma chapa disponível neste bundle.</p>
        )}
      </section>
    </article>
  )
}

export function PublicSharePage({ token }: PublicSharePageProps) {
  const [share, setShare] = useState<Awaited<ReturnType<typeof getPublicShare>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false)
  const [selectedSlabIds, setSelectedSlabIds] = useState<number[]>([])
  const [reservationMessage, setReservationMessage] = useState('')
  const [reservationError, setReservationError] = useState('')
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false)
  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError('')

    void getPublicShare(token)
      .then((result) => {
        if (active) setShare(result)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Este link não está disponível.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const totalSlabs = share?.bundles.reduce((total, bundle) => total + bundle.slabs.length, 0) ?? 0
  const availableSlabCount = share?.bundles.reduce(
    (total, bundle) => total + bundle.slabs.filter((slab) => slab.status === 'AVAILABLE').length,
    0,
  ) ?? 0

  function toggleSlab(slabId: number) {
    setSelectedSlabIds((selected) => selected.includes(slabId)
      ? selected.filter((id) => id !== slabId)
      : [...selected, slabId])
  }

  function toggleBundle(bundleId: number) {
    const slabIds = share?.bundles
      .find((bundle) => bundle.id === bundleId)
      ?.slabs.filter((slab) => slab.status === 'AVAILABLE')
      .map((slab) => slab.id) ?? []
    const allSelected = slabIds.length > 0 && slabIds.every((id) => selectedSlabIds.includes(id))

    setSelectedSlabIds((selected) => allSelected
      ? selected.filter((id) => !slabIds.includes(id))
      : [...new Set([...selected, ...slabIds])])
  }

  function toggleSelectionMode() {
    setIsSelectionEnabled((enabled) => !enabled)
    setSelectedSlabIds([])
    setReservationError('')
    setCreatedReservationId(null)
  }

  async function submitReservation() {
    setReservationError('')
    setIsSubmittingReservation(true)
    try {
      const result = await createPublicReservationRequest(token, selectedSlabIds, reservationMessage)
      setCreatedReservationId(result.id)
      setSelectedSlabIds([])
    } catch (requestError) {
      setReservationError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível enviar sua solicitação. Tente novamente.')
    } finally {
      setIsSubmittingReservation(false)
    }
  }

  return (
    <div className="public-share-layout">
      <header className="public-share-header">
        <div className="brand-lockup app-brand public-share-brand" aria-label="Rodstones">
          <span className="brand-mark" aria-hidden="true">SiO₂</span>
          <span>Gran</span>
        </div>
      </header>

      <main className="public-share-main">
        {isLoading && <p className="public-share-state" aria-live="polite">Carregando catálogo...</p>}
        {!isLoading && error && (
          <section className="public-share-state public-share-error" role="alert">
            <p className="public-section-label">CATÁLOGO</p>
            <h1>Este link não está disponível</h1>
            <p>O catálogo pode ter expirado ou não estar mais ativo.</p>
          </section>
        )}
        {!isLoading && share && (
          <>
            <section className="public-share-intro">
              <p className="public-section-label">SELEÇÃO EXCLUSIVA</p>
              <h1>{share.title || 'Seleção de materiais'}</h1>
              <p className="public-share-company">{share.company.name}</p>
              <div className="public-share-summary">
                <span>{share.bundles.length} {share.bundles.length === 1 ? 'bundle' : 'bundles'}</span>
                <i aria-hidden="true" />
                <span>{totalSlabs} {totalSlabs === 1 ? 'chapa' : 'chapas'}</span>
                {share.expiresAt && <>
                  <i aria-hidden="true" />
                  <span>Válido até {formatDate(share.expiresAt)}</span>
                </>}
              </div>
            </section>
            {availableSlabCount > 0 && !isSelectionEnabled && (
              <section className="public-reservation-entry">
                <div>
                  <h2>Quer reservar alguma chapa?</h2>
                  <p>Você pode continuar navegando pelo catálogo ou selecionar as chapas que deseja.</p>
                </div>
                <button type="button" onClick={toggleSelectionMode}>
                  Iniciar seleção
                </button>
              </section>
            )}
            {isSelectionEnabled && (
              <section className="public-selection-toolbar" aria-live="polite">
                <div>
                  <p className="public-section-label">MODO DE RESERVA</p>
                  <strong>Selecione as chapas desejadas</strong>
                  <span>{selectedSlabIds.length} de {availableSlabCount} selecionadas</span>
                </div>
                <button className="public-selection-cancel" type="button" onClick={toggleSelectionMode}>
                  Voltar ao catálogo
                </button>
              </section>
            )}
            <section className="public-share-bundles" aria-label="Bundles do catálogo">
              {share.bundles.map((bundle, index) => (
                <PublicBundleCard
                  bundle={bundle}
                  index={index}
                  key={bundle.id}
                  isSelectionEnabled={isSelectionEnabled}
                  selectedSlabIds={selectedSlabIds}
                  onToggleSlab={toggleSlab}
                  onToggleBundle={toggleBundle}
                />
              ))}
              {share.bundles.length === 0 && (
                <p className="public-share-state">Nenhum bundle disponível neste catálogo.</p>
              )}
            </section>
            {isSelectionEnabled && !createdReservationId && availableSlabCount > 0 && (
              <form className="public-reservation-form" onSubmit={(event) => {
                event.preventDefault()
                void submitReservation()
              }}>
                <label>
                  <span>Mensagem para a marmoraria <small>opcional</small></span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={reservationMessage}
                    onChange={(event) => setReservationMessage(event.target.value)}
                    placeholder="Conte como pretende utilizar as chapas ou deixe uma observação."
                  />
                </label>
                {reservationError && <p className="public-reservation-error" role="alert">{reservationError}</p>}
                <div className="public-reservation-submit-row">
                  <span>{selectedSlabIds.length} {selectedSlabIds.length === 1 ? 'chapa selecionada' : 'chapas selecionadas'}</span>
                  <button type="submit" disabled={selectedSlabIds.length === 0 || isSubmittingReservation}>
                    {isSubmittingReservation ? 'Enviando...' : 'Enviar solicitação'}
                  </button>
                </div>
              </form>
            )}
            {createdReservationId !== null && (
              <section className="public-reservation-success" role="status" aria-live="polite">
                <span aria-hidden="true">✓</span>
                <div>
                  <p className="public-section-label">SOLICITAÇÃO ENVIADA</p>
                  <h2>Obrigado pelo seu interesse</h2>
                  <p>Sua solicitação #{createdReservationId} foi encaminhada para a equipe da {share.company.name}.</p>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <AppFooter />
    </div>
  )
}