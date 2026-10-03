import { useEffect, useState } from 'react'
import { getProfile, login, switchCompany } from './auth.api'
import { getSupabaseClient } from '../../lib/supabase'
import type { Company, UserProfile } from './auth.types'

const ACCESS_TOKEN_KEY = 'rodstones.accessToken'
const COMPANY_ID_KEY = 'rodstones.companyId'

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [switchingCompanyId, setSwitchingCompanyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      setIsCheckingSession(false)
      return
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) sessionStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)
      else sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    })

    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError
        const token = data.session?.access_token
        if (!token) {
          sessionStorage.removeItem(ACCESS_TOKEN_KEY)
          sessionStorage.removeItem(COMPANY_ID_KEY)
          return null
        }
        sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
        return getProfile(token)
      })
      .then((user) => {
        if (!user) return
        if (!active) return
        setProfile(user)
        const selectedId = Number(sessionStorage.getItem(COMPANY_ID_KEY))
        const selectedCompany = user.memberships?.find(
          ({ company }) => company.id === selectedId,
        )?.company
        if (selectedCompany) setActiveCompany(selectedCompany)
        else sessionStorage.removeItem(COMPANY_ID_KEY)
      })
      .catch(() => {
        if (!active) return
        sessionStorage.removeItem(ACCESS_TOKEN_KEY)
        sessionStorage.removeItem(COMPANY_ID_KEY)
      })
      .finally(() => {
        if (active) setIsCheckingSession(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(email, password)
      sessionStorage.removeItem(COMPANY_ID_KEY)
      sessionStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken)
      setProfile({ name: email, email, memberships: [] })

      try {
        setProfile(await getProfile(result.accessToken))
      } catch {
        // Mantém a sessão ativa caso a consulta complementar do perfil falhe.
      }
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível conectar à plataforma.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function selectCompany(company: Company) {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) return

    setError('')
    setSwitchingCompanyId(company.id)
    try {
      const result = await switchCompany(token, company)
      if (!result.requiresTokenRefresh) {
        throw new Error('A empresa foi alterada, mas a API não solicitou a renovação da sessão.')
      }

      const { data, error: refreshError } = await getSupabaseClient().auth.refreshSession()
      if (refreshError) throw refreshError
      const accessToken = data.session?.access_token
      if (!accessToken) throw new Error('O Supabase não retornou uma sessão renovada.')

      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      sessionStorage.setItem(COMPANY_ID_KEY, String(company.id))
      setActiveCompany(company)
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível selecionar a empresa.')
    } finally {
      setSwitchingCompanyId(null)
    }
  }

  function changeCompany() {
    sessionStorage.removeItem(COMPANY_ID_KEY)
    setActiveCompany(null)
  }

  function signOut() {
    void getSupabaseClient().auth.signOut().catch(() => undefined)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(COMPANY_ID_KEY)
    setProfile(null)
    setActiveCompany(null)
    setError('')
  }

  return {
    profile,
    activeCompany,
    isCheckingSession,
    isSubmitting,
    switchingCompanyId,
    error,
    signIn,
    selectCompany,
    changeCompany,
    signOut,
  }
}