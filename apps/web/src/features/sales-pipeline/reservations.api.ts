import { requestJson } from '../../lib/api'

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

type ReservationClient = {
  id: number
  name: string
  email: string | null
  phone: string | null
  document?: string | null
}

type ReservationSeller = {
  id: number
  name: string
  email: string
}

export type ReservationSummary = {
  id: number
  status: ReservationStatus
  message: string | null
  createdAt: string
  updatedAt: string
  share: {
    id: number
    title: string | null
    createdBy: ReservationSeller
    client: ReservationClient
  }
  items: Array<{
    id: number
    slab: {
      id: number
      number: number
      status: string
      bundle: {
        id: number
        bundleCode: string
      }
    }
  }>
}

export type ReservationDetails = Omit<ReservationSummary, 'share' | 'items'> & {
  share: {
    id: number
    title: string | null
    token: string
    createdBy: ReservationSeller
    client: ReservationClient
  }
  items: Array<{
    id: number
    createdAt: string
    reservationRequestId: number
    slab: {
      id: number
      number: number
      status: string
      length: number | string | null
      height: number | string | null
      area: number | string | null
      bundle: {
        id: number
        bundleCode: string
        material: { name: string }
        finish: { name: string }
      }
    }
  }>
}

export function getReservations(token: string) {
  return requestJson<ReservationSummary[]>('/reservations', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getReservation(token: string, reservationId: number) {
  return requestJson<ReservationDetails>(`/reservations/${reservationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createReservationRequest(
  shareToken: string,
  slabIds: number[],
  message?: string,
) {
  return requestJson<{ id: number; status: ReservationStatus }>(
    `/shares/${encodeURIComponent(shareToken)}/reservation-requests`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slabIds, ...(message?.trim() && { message: message.trim() }) }),
    },
  )
}

export function approveReservation(token: string, reservationId: number) {
  return requestJson<ReservationSummary>(`/reservations/${reservationId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function rejectReservation(token: string, reservationId: number) {
  return requestJson<ReservationSummary>(`/reservations/${reservationId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}