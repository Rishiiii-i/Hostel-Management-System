import './Navbar.css'
import { useState, useEffect } from 'react'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [activeHash, setActiveHash] = useState(() => window.location.hash || '#home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logOut } = useAuth()

  useEffect(() => {
    const handleHash = () => {
      setActiveHash(window.location.hash || '#home')
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev)

  return (
    <header className="nav-header">
      <nav className="nav-container">
        <a className="brand" href="#home">
          <span className="brand-icon-wrapper">
            <Icon name="building" width={22} height={22} />
          </span>
          <span className="brand-text">Smart<span className="brand-highlight">Hostel</span></span>
        </a>

        <div className={`nav-right-actions ${mobileMenuOpen ? 'open' : ''}`}>
          <ThemeToggle />

          <a 
            className={`nav-link-item ${activeHash === '#home' || activeHash === '' ? 'active' : ''}`} 
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </a>
          <a 
            className={`nav-link-item ${activeHash === '#features' ? 'active' : ''}`} 
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a 
            className={`nav-link-item ${activeHash === '#contact' ? 'active' : ''}`} 
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contacts
          </a>
          {user && (
            <a 
              className={`nav-link-item ${activeHash === '#dashboard' || activeHash === '#student-dashboard' ? 'active' : ''}`} 
              href="#dashboard"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </a>
          )}

          {user ? (
            <button 
              type="button"
              onClick={logOut} 
              className="nav-link-login"
            >
              Logout <span className="arrow">→</span>
            </button>
          ) : (
            <a className="nav-link-login" href="#login">
              <span>Sign In</span>
              <span className="arrow">→</span>
            </a>
          )}

          <button 
            type="button" 
            className="mobile-hamburger"
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation Menu"
          >
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </nav>
    </header>
  )
}


