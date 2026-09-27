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