import Icon from './Icon'

export default function Navbar() {
  return (
    <nav className="nav animate-fade-in-slide-down" style={{ animationFillMode: 'both' }}>
      <a className="brand" href="#home">
        <span>
          <Icon name="building" />
        </span>
        {' '}Smart Hostel
      </a>
      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#contact">Contacts</a>
      </div>
      <a className="login" href="#login">
        Sign In <b>&rarr;</b>
      </a>
    </nav>
  )
}
