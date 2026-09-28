import './App.css'
import { useState } from 'react'
import { AppShell } from './AppShell'
import type { AppSection } from './app.types'
import { AuthScreen } from '../features/auth/AuthScreen'
import { BundlesPage } from '../features/bundles/BundlesPage'
import { ClientsPage } from '../features/clients/ClientsPage'
import { PublicSharePage } from '../features/shares/PublicSharePage'
import { useAuth } from '../features/auth/useAuth'
import { SalesPipelinePage } from '../features/sales-pipeline/SalesPipelinePage'

export default function App() {
  const publicShareToken = window.location.pathname.match(/^\/share\/([^/]+)\/?$/)?.[1]

  if (publicShareToken) {
    return <PublicSharePage token={decodeURIComponent(publicShareToken)} />
  }

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  const auth = useAuth()
  const [activeSection, setActiveSection] = useState<AppSection>('home')

  if (auth.isCheckingSession) {
    return <main className="session-check" aria-live="polite">Verificando sessão...</main>
  }

  if (auth.profile && auth.activeCompany) {
    return (
      <AppShell
        profile={auth.profile}
        company={auth.activeCompany}
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onChangeCompany={() => {
          setActiveSection('home')
          auth.changeCompany()
        }}
        onSignOut={() => {
          setActiveSection('home')
          auth.signOut()
        }}
      >
        {activeSection === 'inventory'
          ? <BundlesPage onShareCreated={() => setActiveSection('home')} />
          : activeSection === 'clients'
            ? <ClientsPage />
            : <SalesPipelinePage companyId={auth.activeCompany.id} />}
      </AppShell>
    )
  }

  return (
    <AuthScreen
      profile={auth.profile}
      isSubmitting={auth.isSubmitting}
      switchingCompanyId={auth.switchingCompanyId}
      error={auth.error}
      onSignIn={auth.signIn}
      onSelectCompany={auth.selectCompany}
      onSignOut={auth.signOut}
    />
  )
}