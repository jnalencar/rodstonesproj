import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Company, UserProfile } from './auth.types'
import './AuthScreen.css'

type AuthScreenProps = {
  profile: UserProfile | null
  isSubmitting: boolean
  switchingCompanyId: number | null
  error: string
  onSignIn: (email: string, password: string) => void
  onSelectCompany: (company: Company) => void
  onSignOut: () => void
}

export function AuthScreen({
  profile,
  isSubmitting,
  switchingCompanyId,
  error,
  onSignIn,
  onSelectCompany,
  onSignOut,
}: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSignIn(email, password)
  }

  return (
    <main className="login-layout">
      <aside className="brand-panel">
        <a className="brand-lockup" href="/" aria-label="Rodstones início">
          <span className="brand-mark" aria-hidden="true">SiO₂</span>
          <span>Gran</span>
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
                <h3>Selecione uma empresa para continuar</h3>
                {profile.memberships.map(({ company }) => (
                  <button
                    className="company-choice"
                    key={company.id}
                    type="button"
                    disabled={switchingCompanyId !== null}
                    onClick={() => onSelectCompany(company)}
                  >
                    <span>{company.name}</span>
                    <span>
                      {switchingCompanyId === company.id ? 'Abrindo...' : 'Acessar'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="button" onClick={onSignOut}>
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