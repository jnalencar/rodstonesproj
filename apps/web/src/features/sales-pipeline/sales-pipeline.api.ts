import { requestJson } from '../../lib/api'
import type { ShareOffer } from './sales-pipeline.types'

export function getShares(token: string) {
  return requestJson<ShareOffer[]>('/shares', {
    headers: { Authorization: `Bearer ${token}` },
  })
}