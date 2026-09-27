import { useEffect, useState } from 'react'
import { getShares } from './sales-pipeline.api'
import type { BoardColumn, ShareOffer } from './sales-pipeline.types'
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
    emptyMessage: 'A listagem será conectada quando o endpoint de reservas estiver disponível.',
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

function OfferCard({ share }: { share: ShareOffer }) {
  return (
    <article className="offer-card">
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
    </article>
  )
}

export function SalesPipelinePage({ companyId }: SalesPipelinePageProps) {
  const [shares, setShares] = useState<ShareOffer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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

  return (
      <main className="board-main" id="sales-pipeline">

        <section className="kanban-scroll" aria-label="Quadro Kanban de vendas">
          <div className="kanban-board">
            {BOARD_COLUMNS.map((column) => {
              const columnShares = column.key === 'offers' ? shares : []
              const count = column.key === 'offers' ? shares.length : 0

              return (
                <section className={`kanban-column column-${column.key}`} key={column.key}>
                  <header className="column-heading">
                    <div>
                      <h2>{column.title}</h2>
                      <p>{column.description}</p>
                    </div>
                    <span className="column-count" aria-label={`${count} itens`}>
                      {column.key === 'offers' && isLoading ? '…' : count}
                    </span>
                  </header>

                  <div className="column-cards">
                    {column.key === 'offers' && error && (
                      <p className="column-error" role="alert">{error}</p>
                    )}
                    {column.key === 'offers' && isLoading && shares.length === 0 && (
                      <p className="column-loading" aria-live="polite">Carregando ofertas...</p>
                    )}
                    {columnShares.map((share) => <OfferCard key={share.id} share={share} />)}
                    {column.key !== 'offers' && (
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
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      </main>
  )
}