import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const links = [
    { to: '/', label: '日報', match: ['/', '/daily'] },
    { to: '/monthly', label: '月報' },
    { to: '/yearly', label: '年報' },
    { to: '/performance', label: '個人成績' },
    { to: '/staff', label: '従業員登録' }
  ]

  useEffect(() => {
    const handleWheel = (event) => {
      const activeElement = document.activeElement
      if (
        activeElement &&
        activeElement.tagName === 'INPUT' &&
        activeElement.type === 'number'
      ) {
        event.preventDefault()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <header className="fixed top-0 left-0 right-0 z-50 text-white shadow-md bg-header transition-colors">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-accent">Bar Manager</h1>
            <button
              type="button"
              aria-label="メニューを開く"
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[var(--accent)] transition-colors"
              style={{ color: 'var(--accent)' }}
              onClick={() => setIsMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-64 max-w-[80%] z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--menu-bg)', color: 'var(--accent)' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end px-4 py-3 border-b border-strong">
            <button
              type="button"
              aria-label="メニューを閉じる"
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="var(--accent)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {links.map(({ to, label, match = [to] }) => {
              const isActive = match.includes(location.pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-5 py-3 block text-sm font-medium transition-colors ${
                    isActive ? 'bg-[var(--accent)] text-[var(--header-bg)]' : 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="px-5 py-3 border-t border-strong space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)]/10"
              style={{ color: 'var(--accent)' }}
            >
              {theme === 'dark' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 116.707 2.707a8.001 8.001 0 0010.586 10.586z" />
                  </svg>
                  <span>ライトテーマに変更</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.47a1 1 0 011.414 1.414l-.707.706a1 1 0 01-1.414-1.414l.707-.706zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zm-2.366 6.95a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.415l.707.706zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.366 15.95l.707-.706a1 1 0 10-1.414-1.415l-.707.707a1 1 0 101.414 1.414zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm1.05-5.634a1 1 0 10-1.414-1.415l-.707.707A1 1 0 104.343 5.05l.707-.707z" />
                    <path d="M10 6a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  <span>ダークテーマに変更</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut()
                setIsMenuOpen(false)
                navigate('/login', { replace: true })
              }}
              className="w-full px-4 py-2 rounded-md text-sm font-medium hover:bg-[#FCAF17]/10 transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      <main className="container mx-auto px-4 pb-20 pt-24 text-primary">
        {children}
      </main>
    </div>
  )
}

export default Layout

