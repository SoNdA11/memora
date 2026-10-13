import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  List,
  BarChart3,
  FolderTree,
  Notebook,
  BookText,
  History,
  AlertTriangle,
  CalendarDays,
  Timer,
  Map,
  ScanEye,
  Sun,
  Moon,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  PlusCircle,
  User,
  Languages,
  BookMarked,
} from 'lucide-react'
import { useState, useEffect, type ReactNode } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Logo from './Logo'

/* ── Navigation structure ── */
interface NavLink {
  to: string
  label: string
  icon: React.ElementType
  end?: boolean
  badge?: number
}

interface NavGroup {
  label: string
  links: NavLink[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Estudar',
    links: [
      { to: '/review',   label: 'Revisar Hoje',  icon: BookOpen },
      { to: '/questions', label: 'Questões',      icon: List },
      { to: '/phrasal-verbs', label: 'Phrasal Verbs', icon: Languages },
      { to: '/accentuation', label: 'Acentuação', icon: BookMarked },
      { to: '/review/wrong', label: 'Erros',      icon: AlertTriangle },
      { to: '/notebooks', label: 'Cadernos',      icon: Notebook },
      { to: '/theory',   label: 'Teoria',         icon: BookText },
    ],
  },
  {
    label: 'Análise',
    links: [
      { to: '/stats',         label: 'Estatísticas',  icon: BarChart3 },
      { to: '/calendar',      label: 'Calendário',    icon: CalendarDays },
      { to: '/exams',         label: 'Provas',        icon: Timer },
      { to: '/map',           label: 'Mapa Edital',   icon: Map },
      { to: '/exam-analyses', label: 'Raio-X',        icon: ScanEye },
      { to: '/subjects',      label: 'Matérias',      icon: FolderTree },
    ],
  },
]

/* ── Sidebar link item ── */
function SidebarLink({
  link,
  collapsed,
  onClick,
}: {
  link: NavLink
  collapsed: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onClick}
      title={collapsed ? link.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
          collapsed ? 'justify-center w-9 h-9 mx-auto' : 'px-2.5 py-1.5 w-full'
        } ${
          isActive
            ? 'bg-lumi-accent/10 text-lumi-accent'
            : 'text-lumi-text2 hover:text-lumi-text hover:bg-lumi-text/[0.05]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator — left bar */}
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-lumi-accent -ml-2.5" />
          )}

          <link.icon
            size={15}
            className={`shrink-0 transition-colors ${
              isActive ? 'text-lumi-accent' : 'text-lumi-text3 group-hover:text-lumi-text'
            }`}
          />

          {!collapsed && (
            <span className="text-[13px] font-medium leading-none truncate">
              {link.label}
            </span>
          )}

          {/* Badge */}
          {!collapsed && link.badge != null && link.badge > 0 && (
            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-lumi-accent text-white text-[10px] font-semibold">
              {link.badge > 99 ? '99+' : link.badge}
            </span>
          )}

          {/* Collapsed tooltip */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap">
              <span className="bg-lumi-text text-lumi-bg text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-md">
                {link.label}
              </span>
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── Main Sidebar component ── */
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  // Persist collapsed state in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('memora-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem('memora-sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      className={`flex flex-col h-full border-r transition-[width] duration-200 ease-in-out overflow-hidden z-50 ${
        isDark
          ? 'bg-lumi-surface border-lumi-border'
          : 'bg-white border-[#E5E7EB]'
      }`}
    >
      {/* ── Header: Logo + collapse toggle ── */}
      <div className={`flex items-center h-14 shrink-0 border-b ${
        isDark ? 'border-lumi-border' : 'border-[#E5E7EB]'
      } ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!collapsed && <Logo />}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden btn-icon"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex btn-icon"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3 space-y-5 ${
        collapsed ? 'px-1.5' : 'px-3'
      }`}>
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
              <p className="section-label px-2.5 mb-1.5">{group.label}</p>
            )}

            <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
              {group.links.map((link) => (
                <SidebarLink
                  key={link.to}
                  link={link}
                  collapsed={collapsed}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── Extra actions (collapsed-friendly) ── */}
        {!collapsed && (
          <div className="pt-2 border-t border-lumi-border space-y-0.5">
            <p className="section-label px-2.5 mb-1.5">Ações</p>
            <NavLink
              to="/questions/new"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-lumi-accent/10 text-lumi-accent'
                    : 'text-lumi-text2 hover:text-lumi-text hover:bg-lumi-text/[0.05]'
                }`
              }
            >
              <PlusCircle size={15} className="text-lumi-text3 shrink-0" />
              Nova Questão
            </NavLink>
            <NavLink
              to="/review/history"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-lumi-accent/10 text-lumi-accent'
                    : 'text-lumi-text2 hover:text-lumi-text hover:bg-lumi-text/[0.05]'
                }`
              }
            >
              <History size={15} className="text-lumi-text3 shrink-0" />
              Histórico
            </NavLink>
            <NavLink
              to="/questions/import"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-lumi-accent/10 text-lumi-accent'
                    : 'text-lumi-text2 hover:text-lumi-text hover:bg-lumi-text/[0.05]'
                }`
              }
            >
              <Layers size={15} className="text-lumi-text3 shrink-0" />
              Importar
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── Footer: Theme toggle ── */}
      <div className={`border-t ${
        isDark ? 'border-[#1f1f23]' : 'border-[#E5E7EB]'
      } ${collapsed ? 'flex flex-col items-center gap-1 py-3' : 'px-3 py-3'}`}>
        {collapsed ? (
          <button
            onClick={toggle}
            className="btn-icon"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        ) : (
          <button
            onClick={toggle}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-lumi-text2 hover:text-lumi-text hover:bg-lumi-text/[0.05] transition-all duration-150"
          >
            {isDark ? <Sun size={14} className="text-lumi-text3" /> : <Moon size={14} className="text-lumi-text3" />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>
        )}
      </div>
    </aside>
  )
}
