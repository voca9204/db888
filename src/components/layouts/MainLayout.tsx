import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

// Icons (these would be imported from an icon library in a real app)
const DashboardIcon = () => <span>📊</span>
const ConnectionIcon = () => <span>🔌</span>
const TableIcon = () => <span>📋</span>
const QueryIcon = () => <span>🔍</span>
const TemplateIcon = () => <span>📁</span>
const ERDIcon = () => <span>🔄</span>
const SettingsIcon = () => <span>⚙️</span>
const LogoIcon = () => <span>🗄️</span>
const MenuIcon = () => <span>≡</span>
const SunIcon = () => <span>☀️</span>
const MoonIcon = () => <span>🌙</span>

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setDarkMode(!darkMode)
  }

  const navItems = [
    { to: '/', icon: <DashboardIcon />, label: 'Dashboard' },
    { to: '/connections', icon: <ConnectionIcon />, label: 'Connections' },
    { to: '/table-browser', icon: <TableIcon />, label: 'Table Browser' },
    { to: '/query-builder', icon: <QueryIcon />, label: 'Query Builder' },
    { to: '/query-templates', icon: <TemplateIcon />, label: 'Query Templates' },
    { to: '/erd', icon: <ERDIcon />, label: 'ERD Visualizer' },
    { to: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-dark-800">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-40 flex w-64 flex-col bg-white transition-all duration-300 dark:bg-dark-700 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 py-6">
          <NavLink to="/" className="flex items-center space-x-2">
            <LogoIcon />
            <span className="text-xl font-bold">DB888</span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-600'
                }`
              }
              end={item.to === '/'}
            >
              <div className="mr-3">{item.icon}</div>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:border-dark-600 dark:bg-dark-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-4 lg:hidden"
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>

          <div className="ml-auto flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-600"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="relative">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                U
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>

      {/* Overlay for sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default MainLayout
