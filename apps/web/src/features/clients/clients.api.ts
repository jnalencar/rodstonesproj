import { requestJson } from '../../lib/api'

export type ClientOption = {
  id: number
  name: string
}

export function getClients(token: string) {
  return requestJson<ClientOption[]>('/clients', {
    headers: { Authorization: `Bearer ${token}` },
  })
}