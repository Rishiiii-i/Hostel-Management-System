import { useState, useEffect } from 'react'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [activeHash, setActiveHash] = useState(() => window.location.hash || '#home')

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

      <div className="nav-right-actions">
        <ThemeToggle />

        <a className={`nav-link-item ${activeHash === '#home' ? 'active' : ''}`} href="#home">Home</a>
        <a className={`nav-link-item ${activeHash === '#features' ? 'active' : ''}`} href="#features">Features</a>
        <a className={`nav-link-item ${activeHash === '#contact' ? 'active' : ''}`} href="#contact">Contacts</a>

        <a className="login" href="#login">
          Sign In <span className="login-arrow">→</span>
        </a>
      </div>
    </nav>
  )
}
