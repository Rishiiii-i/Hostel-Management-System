import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
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

        <a className="nav-link-item" href="#home">Home</a>
        <a className="nav-link-item" href="#features">Features</a>
        <a className="nav-link-item" href="#contact">Contacts</a>

        <a className="login" href="#login">
          Sign In <span className="login-arrow">→</span>
        </a>
      </div>
    </nav>
  )
}
