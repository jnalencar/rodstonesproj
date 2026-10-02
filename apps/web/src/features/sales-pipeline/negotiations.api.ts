import { requestJson } from '../../lib/api'

export type NegotiationStatus = 'IN_NEGOTIATION' | 'AWAITING_BOOKING' | string

export type NegotiationSummary = {
  id: number
  reservationRequestId: number
  status: NegotiationStatus
  paymentTerms: string | null
  portOfLoading: string | null
  portOfDestination: string | null
  shippingMethod: string | null
  incoterm: string | null
  containerType: string | null
  deliveryTime: string | null
  truckingFee: number | string | null
  oceanFreight: number | string | null
  invoice: string | null
  packingInfo: string | null
  invoiceUploaded: boolean
  packingListUploaded: boolean
  poUploaded: boolean
  remarks: string | null
  createdAt: string
  updatedAt: string
  reservationRequest: {
    id: number
    status: string
    message: string | null
    createdAt: string
    share: {
      id: number
      title: string | null
      client: { id: number; name: string; email: string | null; phone: string | null }
    }
    items: Array<{
      slabId: number
      slab: {
        id: number
        number: number
        status: string
        bundleId: number
        bundle: { id: number; bundleCode: string }
      }
    }>
  }
  files?: NegotiationFile[]
}

export type NegotiationFile = {
  id: number
  fileName: string
  contentType: string | null
  size: number | null
  createdAt: string
  url: string
}

export type NegotiationFields = {
  paymentTerms: string
  portOfLoading: string
  portOfDestination: string
  incoterm: string
  containerType: string
  deliveryTime: string
  truckingFee: number | null
  oceanFreight: number | null
  invoice: string
  packingInfo: string
  invoiceUploaded: boolean
  packingListUploaded: boolean
  poUploaded: boolean
  remarks: string
}

export function getNegotiations(token: string) {
  return requestJson<NegotiationSummary[]>('/negotiations', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getNegotiation(token: string, negotiationId: number) {
  return requestJson<NegotiationSummary>(`/negotiations/${negotiationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function updateNegotiation(
  token: string,
  negotiationId: number,
  fields: NegotiationFields,
) {
  return requestJson<NegotiationSummary>(`/negotiations/${negotiationId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  })
}

export function uploadNegotiationFile(
  token: string,
  negotiationId: number,
  file: File,
) {
  const body = new FormData()
  body.append('file', file)
  return requestJson<NegotiationFile>(`/negotiations/${negotiationId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
}

export function deleteNegotiationFile(
  token: string,
  negotiationId: number,
  fileId: number,
) {
  return requestJson<{ id: number }>(`/negotiations/${negotiationId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}