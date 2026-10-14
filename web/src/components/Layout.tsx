import { useState, useEffect } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import ErrorBoundary from './ErrorBoundary'
import { Menu, Search, PlusCircle, BookOpen } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

/* ── Route title map for the Topbar ── */
const ROUTE_TITLES: Record<string, string> = {
  '/':                'Dashboard',
  '/questions':       'Questões',
  '/questions/new':   'Nova Questão',
  '/questions/import': 'Importar Questões',
  '/review':          'Revisar Hoje',
  '/review/flashcards': 'Flashcards',
  '/review/history':  'Histórico',
  '/review/subject':  'Revisar por Matéria',
  '/review/wrong':    'Revisar Erros',
  '/notebooks':       'Cadernos',
  '/stats':           'Estatísticas',
  '/subjects':        'Matérias',
  '/theory':          'Teoria',
  '/calendar':        'Calendário',
  '/exams':           'Provas',
  '/map':             'Mapa do Edital',
  '/exam-analyses':   'Raio-X de Provas',
}

function getRouteTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Dynamic routes
  if (pathname.startsWith('/questions/') && pathname.endsWith('/edit')) return 'Editar Questão'
  if (pathname.startsWith('/questions/')) return 'Questão'
  if (pathname.startsWith('/notebooks/')) return 'Caderno'
  if (pathname.startsWith('/theory/') && pathname.endsWith('/edit')) return 'Editar Teoria'
  if (pathname.startsWith('/theory/new')) return 'Nova Teoria'
  if (pathname.startsWith('/theory/')) return 'Teoria'
  if (pathname.startsWith('/exam-analyses/') && pathname.endsWith('/edit')) return 'Editar Raio-X'
  if (pathname.startsWith('/exam-analyses/new')) return 'Novo Raio-X'
  if (pathname.startsWith('/exam-analyses/')) return 'Raio-X de Prova'
  return 'Memora'
}

/* ── Topbar ── */
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const title = getRouteTitle(location.pathname)

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-14 shrink-0 border-b transition-colors ${
        isDark
          ? 'bg-lumi-surface/80 border-lumi-border backdrop-blur-md'
          : 'bg-white/80 border-[#E5E7EB] backdrop-blur-md'
      }`}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="md:hidden btn-icon shrink-0"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Page title — desktop only */}
      <h1 className="hidden md:block text-sm font-semibold text-lumi-text tracking-tight">
        {title}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        <NavLink
          to="/questions/new"
          className="btn btn-secondary btn-sm hidden sm:inline-flex"
          title="Nova Questão"
        >
          <PlusCircle size={13} />
          Nova
        </NavLink>
        <NavLink
          to="/review"
          className="btn btn-primary btn-sm"
          title="Revisar Hoje"
        >
          <BookOpen size={13} />
          <span className="hidden sm:inline">Revisar</span>
        </NavLink>
      </div>
    </header>
  )
}

/* ── Main Layout ── */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-lumi-bg' : 'bg-[#F7F7F8]'}`}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed on desktop, slide-in on mobile */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out shrink-0`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
