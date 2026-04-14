import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, ShoppingCart, Sun, Moon, Zap, LogOut } from 'lucide-react'

const PAGE_LABELS = {
  '/dashboard': 'Dashboard',
  '/products': 'Productos',
  '/sales': 'Ventas',
}

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextTheme = stored || (prefersDark ? 'dark' : 'light')
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/', { replace: true })
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/products', label: 'Productos', Icon: Package },
    { to: '/sales', label: 'Ventas', Icon: ShoppingCart },
  ]

  const pageLabel = PAGE_LABELS[location.pathname] || 'Emprende'

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <span className="brand-mark">
            <Zap size={18} strokeWidth={2.5} />
          </span>
          <div>
            <p className="brand-title">Emprende</p>
            <p className="brand-subtitle">Entende si estas ganando plata</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon" aria-hidden>
                <Icon size={17} strokeWidth={2} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label="Cambiar tema">
            {theme === 'dark'
              ? <><Sun size={15} strokeWidth={2} /> <span>Modo claro</span></>
              : <><Moon size={15} strokeWidth={2} /> <span>Modo oscuro</span></>
            }
          </button>
          <button className="logout-button" onClick={handleLogout} type="button" aria-label="Cerrar sesion">
            <LogOut size={15} strokeWidth={2} />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <main className="app-content">
        <div className="content-topline">
          <span className="topline-breadcrumb">
            <Zap size={13} strokeWidth={2.5} style={{ opacity: 0.5 }} />
            Emprende
          </span>
          <span className="topline-sep">/</span>
          <span className="topline-current">{pageLabel}</span>
        </div>
        {children}
      </main>
    </div>
  )
}
