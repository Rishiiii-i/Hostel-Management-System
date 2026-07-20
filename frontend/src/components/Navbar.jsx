import { useState, useEffect } from 'react'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })
  const { user, logOut } = useAuth()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <nav className="nav">
      <a className="brand" href="#home">
        <span>
          <Icon name="building" />
        </span>
        {' '}Smart Hostel
      </a>

      <div className="nav-right-actions">
        <button 
          type="button" 
          className={`theme-toggle-switch ${darkMode ? 'dark' : 'light'}`} 
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          <span className="toggle-track">
            <span className="toggle-thumb">
              {darkMode ? (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              )}
            </span>
          </span>
        </button>

        <a className="nav-link-item" href="#home">Home</a>
        <a className="nav-link-item" href="#features">Features</a>
        <a className="nav-link-item" href="#contact">Contacts</a>
        {user && <a className="nav-link-item" href="#dashboard">Dashboard</a>}

        {user ? (
          <button 
            type="button"
            onClick={logOut} 
            className="login" 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-primary)', 
              fontFamily: 'inherit',
              fontSize: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: 0
            }}
          >
            Logout <span className="login-arrow">→</span>
          </button>
        ) : (
          <a className="login" href="#login">
            Sign In <span className="login-arrow">→</span>
          </a>
        )}
      </div>
    </nav>
  )
}
