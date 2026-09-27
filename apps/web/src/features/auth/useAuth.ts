import { useEffect, useState } from 'react'
import { getProfile, login, switchCompany } from './auth.api'
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
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setIsCheckingSession(false)
      return
    }

    let active = true
    void getProfile(token)
      .then((user) => {
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
        sessionStorage.removeItem(ACCESS_TOKEN_KEY)
        sessionStorage.removeItem(COMPANY_ID_KEY)
      })
      .finally(() => {
        if (active) setIsCheckingSession(false)
      })

    return () => {
      active = false
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
      sessionStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken)
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