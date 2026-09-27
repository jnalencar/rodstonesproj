import { requestJson } from '../../lib/api'
import type { Company, UserProfile } from './auth.types'

type LoginResponse = {
  accessToken: string
}

export function login(email: string, password: string) {
  return requestJson<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function getProfile(token: string) {
  return requestJson<UserProfile>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function switchCompany(token: string, company: Company) {
  return requestJson<LoginResponse>('/auth/switch-company', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyId: company.id }),
  })
}