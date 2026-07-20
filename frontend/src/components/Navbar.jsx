import './Navbar.css'
import { useState, useEffect } from 'react'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [activeHash, setActiveHash] = useState(() => window.location.hash || '#home')
  const { user, logOut } = useAuth()

  useEffect(() => {
    const handleHash = () => {
      setActiveHash(window.location.hash || '#home')
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  return (
    <nav className="nav">
      <a className="brand" href="#home">
        <span>
          <Icon name="building" />
        </span>
        {' '}Smart Hostel
      </a>

      <div className="nav-links">
        <a className={`nav-link-item ${activeHash === '#home' ? 'active' : ''}`} href="#home">Home</a>
        <a className={`nav-link-item ${activeHash === '#features' ? 'active' : ''}`} href="#features">Features</a>
        <a className={`nav-link-item ${activeHash === '#contact' ? 'active' : ''}`} href="#contact">Contacts</a>
        {user && <a className={`nav-link-item ${activeHash === '#dashboard' ? 'active' : ''}`} href="#dashboard">Dashboard</a>}
      </div>

      <div className="nav-right-actions">
        <ThemeToggle />

        {user ? (
          <button 
            type="button"
            onClick={logOut} 
            className="login"
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
