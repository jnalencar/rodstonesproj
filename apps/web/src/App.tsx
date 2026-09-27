import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL).replace(/\/$/, '')

type UserProfile = {
  name: string
  email: string
  memberships?: Array<{
    company: {
      id: number
      name: string
    }
  }>
}

type ApiErrorBody = {
  message?: string | string[]
}

async function getErrorMessage(response: Response) {
  const body = await response.json().catch(() => null) as ApiErrorBody | null

  if (Array.isArray(body?.message)) return body.message.join(', ')
  if (body?.message) return body.message
  return 'Não foi possível concluir a solicitação.'
}

async function getProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<UserProfile>
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [switchingCompanyId, setSwitchingCompanyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeCompany, setActiveCompany] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) {
      setIsCheckingSession(false)
      return
    }

    let active = true
    void getProfile(token)
      .then((user) => {
        if (!active) return
        setProfile(user)
        const selectedId = Number(sessionStorage.getItem('rodstones.companyId'))
        const selectedCompany = user.memberships?.find(
          ({ company }) => company.id === selectedId,
        )?.company
        if (selectedCompany) setActiveCompany(selectedCompany)
        else sessionStorage.removeItem('rodstones.companyId')
      })
      .catch(() => {
        sessionStorage.removeItem('rodstones.accessToken')
        sessionStorage.removeItem('rodstones.companyId')
      })
      .finally(() => {
        if (active) setIsCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      const result = await response.json() as { accessToken: string }
      sessionStorage.removeItem('rodstones.companyId')
      sessionStorage.setItem('rodstones.accessToken', result.accessToken)
      setProfile({ name: email, email, memberships: [] })

      try {
        setProfile(await getProfile(result.accessToken))
      } catch {
        // O login continua válido mesmo se a consulta complementar do perfil falhar.
      }
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível conectar à plataforma.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCompanySwitch(company: { id: number; name: string }) {
    const token = sessionStorage.getItem('rodstones.accessToken')
    if (!token) return

    setError('')
    setSwitchingCompanyId(company.id)
    try {
      const response = await fetch(`${API_URL}/auth/switch-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId: company.id }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      const result = await response.json() as { accessToken: string }
      sessionStorage.setItem('rodstones.accessToken', result.accessToken)
      sessionStorage.setItem('rodstones.companyId', String(company.id))
      setActiveCompany(company)
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Não foi possível selecionar a empresa.')
    } finally {
      setSwitchingCompanyId(null)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('rodstones.accessToken')
    sessionStorage.removeItem('rodstones.companyId')
    setProfile(null)
    setActiveCompany(null)
    setPassword('')
    setError('')
  }

  if (isCheckingSession) {
    return <main className="session-check" aria-live="polite">Verificando sessão...</main>
  }

  return (
    <main className="login-layout">
      <aside className="brand-panel">
        <a className="brand-lockup" href="/" aria-label="Rodstones início">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RODSTONES</span>
        </a>
        <div className="brand-copy">
          <p className="eyebrow">PLATAFORMA DE GESTÃO</p>
          <h1>Pedras naturais.<br />Negócios em movimento.</h1>
          <p className="brand-description">
            Seu espaço para acompanhar a operação e cuidar das relações com seus clientes.
          </p>
        </div>
        <p className="brand-caption">GESTÃO DE ROCHAS NATURAIS</p>
      </aside>

      <section className="form-panel" aria-label="Acesso à plataforma">
        {profile ? (
          <div className="signed-in" aria-live="polite">
            <p className="eyebrow">SESSÃO ATIVA</p>
            <h2>Olá, {profile.name || profile.email}</h2>
            <p className="signed-in-email">{profile.email}</p>
            {profile.memberships && profile.memberships.length > 0 && (
              <div className="company-list">
                <h3>{activeCompany ? 'Empresa selecionada' : 'Selecione uma empresa para continuar'}</h3>
                {profile.memberships.map(({ company }) => (
                  <button
                    className="company-choice"
                    key={company.id}
                    type="button"
                    disabled={switchingCompanyId !== null}
                    onClick={() => handleCompanySwitch(company)}
                  >
                    <span>{company.name}</span>
                    <span>
                      {activeCompany?.id === company.id
                        ? 'Ativa'
                        : switchingCompanyId === company.id
                          ? 'Abrindo...'
                          : 'Acessar'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="button" onClick={handleLogout}>
              Sair da conta
            </button>
          </div>
        ) : (
          <div className="login-form-wrap">
            <div className="form-heading">
              <p className="eyebrow">ACESSO À CONTA</p>
              <h2>Boas-vindas de volta</h2>
              <p>Entre com seu e-mail e senha para continuar.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <div className="password-label-row">
                <label htmlFor="password">Senha</label>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {error && <p className="form-error" role="alert">{error}</p>}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
                {!isSubmitting && <span aria-hidden="true">↗</span>}
              </button>
            </form>

            <p className="form-note">Acesso disponível para usuários cadastrados.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
