import { lazy, Suspense, useEffect } from 'react'
import { getModule, type ModuleId } from './data/modules'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pigeon } from './components/Pigeon'
import { recordVisit } from './lib/progress'
import { useRoute } from './router'
import SanctuaryPage from './modules/sanctuary/SanctuaryPage'

// Módulos 2–4 em chunks separados: a tela inicial carrega só o necessário.
const OraclePage = lazy(() => import('./modules/oracle/OraclePage'))
const FeedPage = lazy(() => import('./modules/feed/FeedPage'))
const MailPage = lazy(() => import('./modules/mail/MailPage'))
const FarmPage = lazy(() => import('./modules/farm/FarmPage'))

function renderRoute(route: ModuleId) {
  switch (route) {
    case 'santuario':
      return <SanctuaryPage />
    case 'oraculo':
      return <OraclePage />
    case 'alimentar':
      return <FeedPage />
    case 'correio':
      return <MailPage />
    case 'fazenda':
      return <FarmPage />
  }
}

function Loading() {
  return (
    <div className="app-loading" role="status">
      <div className="app-loading__pigeon">
        <Pigeon />
      </div>
      <p>O pombo está chegando…</p>
    </div>
  )
}

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = route === 'santuario' ? 'Pru no Sekai' : `${getModule(route).name} · Pru no Sekai`
    // visitas contam para cartas do Correio (ex.: "visitar o Oráculo")
    recordVisit(route)
  }, [route])

  return (
    // key: cada rota monta do zero (foco, animações de entrada) e, depois de
    // uma falha, trocar de módulo tira a tela de erro
    <ErrorBoundary key={route}>
      <Suspense fallback={<Loading />}>
        <div>{renderRoute(route)}</div>
      </Suspense>
    </ErrorBoundary>
  )
}
