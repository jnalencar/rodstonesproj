import { requestJson } from '../../lib/api'
import type { BundleDetails, BundleInventoryItem } from './bundles.types'

export function getBundleInventory(token: string) {
  return requestJson<BundleInventoryItem[]>('/bundles/list', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getBundleDetails(token: string, bundleId: number) {
  return requestJson<BundleDetails>(`/bundles/${bundleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}