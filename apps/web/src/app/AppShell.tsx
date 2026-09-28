import type { ReactNode } from 'react'
import type { Company, UserProfile } from '../features/auth/auth.types'
import type { AppSection } from './app.types'

type AppShellProps = {
  profile: UserProfile
  company: Company
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
  onChangeCompany: () => void
  onSignOut: () => void
  children: ReactNode
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span className="footer-signature">RODSTONES</span>
      <span>Gestão de rochas naturais</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  )
}

export function AppShell({
  profile,
  company,
  activeSection,
  onNavigate,
  onChangeCompany,
  onSignOut,
  children,
}: AppShellProps) {
  const userInitial = (profile.name || profile.email).trim().charAt(0).toLocaleUpperCase('pt-BR')

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup app-brand" href="#home" aria-label="Rodstones início">
          <span className="brand-mark" aria-hidden="true">SiO₂</span>
          <span>Gran</span>
        </a>

        <nav className="topbar-menu" aria-label="Menu principal">
          <button
            type="button"
            aria-current={activeSection === 'home' ? 'page' : undefined}
            onClick={() => onNavigate('home')}
          >
            Início
          </button>
          <button
            type="button"
            aria-current={activeSection === 'inventory' ? 'page' : undefined}
            onClick={() => onNavigate('inventory')}
          >
            Estoque
          </button>
          <button
            type="button"
            aria-current={activeSection === 'clients' ? 'page' : undefined}
            onClick={() => onNavigate('clients')}
          >
            Clientes
          </button>
        </nav>

        <div className="topbar-actions">
          <button
            className="topbar-company"
            type="button"
            onClick={onChangeCompany}
            title="Trocar empresa"
          >
            <span className="company-indicator" aria-hidden="true" />
            <span>{company.name}</span>
            <span className="company-chevron" aria-hidden="true">⌄</span>
          </button>
          <span className="topbar-avatar" aria-label={`Usuário ${profile.name || profile.email}`}>
            {userInitial}
          </span>
          <button className="topbar-logout" type="button" onClick={onSignOut}>
            Sair
          </button>
        </div>
      </header>

      <div className="app-content">{children}</div>

      <AppFooter />
    </div>
  )
}