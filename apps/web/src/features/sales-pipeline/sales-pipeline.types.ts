export type ShareOffer = {
  id: number
  title: string | null
  status: string
  createdAt: string
  expiresAt: string | null
  client: { id: number; name: string } | null
  itemCount: number
  items: Array<{
    id: number
    bundleCode?: string | null
  }>
}

export type BoardColumn = {
  key: 'offers' | 'reservations' | 'negotiation' | 'payment' | 'logistics' | 'invoices'
  title: string
  description: string
  emptyMessage: string
}