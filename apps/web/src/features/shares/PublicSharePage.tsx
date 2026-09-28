import { useEffect, useState } from 'react'
import { AppFooter } from '../../app/AppShell'
import { getPublicShare } from './shares.api'
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

function PublicBundleCard({ bundle, index }: { bundle: PublicShareBundle; index: number }) {
  const cover = bundle.images.find((image) => image.isPrimary) ?? bundle.images[0]
  const price = formatCurrency(bundle.basePrice)
  const availableSlabCount = bundle.slabs.filter((slab) => slab.status === 'AVAILABLE').length

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
                <article className="public-slab-card" key={slab.id}>
                  {slabImage ? (
                    <img src={slabImage.url} alt={`Chapa ${slab.number}`} />
                  ) : (
                    <div className="public-slab-image-placeholder" aria-hidden="true">{String(slab.number).padStart(2, '0')}</div>
                  )}
                  <div className="public-slab-content">
                    <header>
                      <h4>Chapa {String(slab.number).padStart(2, '0')}</h4>
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
            <section className="public-share-bundles" aria-label="Bundles do catálogo">
              {share.bundles.map((bundle, index) => (
                <PublicBundleCard bundle={bundle} index={index} key={bundle.id} />
              ))}
              {share.bundles.length === 0 && (
                <p className="public-share-state">Nenhum bundle disponível neste catálogo.</p>
              )}
            </section>
          </>
        )}
      </main>

      <AppFooter />
    </div>
  )
}