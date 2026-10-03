import { requestJson } from '../../lib/api'
import { getSupabaseClient } from '../../lib/supabase'
import type { Company, UserProfile } from './auth.types'

type LoginResponse = {
  accessToken: string
}

type SwitchCompanyResponse = {
  message: string
  company: Company
  membershipId: number
  requiresTokenRefresh: boolean
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  if (!data.session) throw new Error('O Supabase não retornou uma sessão de acesso.')

  return { accessToken: data.session.access_token }
}

export function getProfile(token: string) {
  return requestJson<UserProfile>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function switchCompany(token: string, company: Company) {
  return requestJson<SwitchCompanyResponse>('/auth/switch-company', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyId: company.id }),
  })
}