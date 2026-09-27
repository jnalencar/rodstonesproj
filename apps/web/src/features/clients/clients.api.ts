import { requestJson } from '../../lib/api'

export type ClientOption = {
  id: number
  name: string
}

export type ClientStatus = 'ACTIVE' | 'INACTIVE'

export type ClientRecord = ClientOption & {
  companyId: number
  email: string | null
  phone: string | null
  document: string | null
  notes: string | null
  status: ClientStatus
  createdAt: string
  updatedAt: string
}

export type ClientInput = {
  name: string
  email?: string
  phone?: string
  document?: string
  notes?: string
}

export function getClients(token: string) {
  return requestJson<ClientRecord[]>('/clients', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getClient(token: string, clientId: number) {
  return requestJson<ClientRecord>(`/clients/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createClient(token: string, input: ClientInput) {
  return requestJson<ClientRecord>('/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
}

export function updateClient(
  token: string,
  clientId: number,
  input: ClientInput & { status: ClientStatus },
) {
  return requestJson<ClientRecord>(`/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
}

export function deleteClient(token: string, clientId: number) {
  return requestJson<{ message: string }>(`/clients/${clientId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}