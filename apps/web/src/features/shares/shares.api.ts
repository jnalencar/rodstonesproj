import { requestJson } from '../../lib/api'

export type CreateShareInput = {
  clientId: number
  bundleIds: number[]
  title?: string
  expiresAt?: string
}

export type CreatedShare = {
  id: number
  token: string
  title: string | null
  status: string
}

export function createShare(token: string, input: CreateShareInput) {
  return requestJson<CreatedShare>('/shares', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
}

export type PublicShareBundle = {
  id: number
  bundleCode: string
  block: string | null
  location: string | null
  thickness: number | string | null
  weight: number | string | null
  basePrice: number | string | null
  material: { name: string; description?: string | null }
  materialType: { name: string }
  materialClassification: { name: string }
  quality: { name: string }
  finish: { name: string }
  images: Array<{
    id: number
    url: string
    originalName: string
    isPrimary: boolean
  }>
  slabs: Array<{
    id: number
    number: number
    length: number | string | null
    height: number | string | null
    area: number | string | null
    status: string
    images: Array<{
      id: number
      url: string
      originalName: string
    }>
  }>
}

export type PublicShare = {
  id: number
  title: string | null
  expiresAt: string | null
  company: { id: number; name: string }
  bundles: PublicShareBundle[]
}

export function getPublicShare(token: string) {
  return requestJson<PublicShare>(`/shares/${encodeURIComponent(token)}`)
}