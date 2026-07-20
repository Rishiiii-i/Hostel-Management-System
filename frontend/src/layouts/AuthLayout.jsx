import Icon from '../components/Icon'

export default function AuthLayout({ children }) {
  return <main className="auth-page">
    <section className="auth-showcase">
      <a className="auth-brand" href="#home">
        <span>
          <Icon name="building" />
        </span>
        Smart Hostel
      </a>
      <div className="auth-showcase__content">
        <p className="auth-kicker">HOSTEL MANAGEMENT SYSTEM</p>
        <h2>Make room for<br /><em>better hostel days.</em></h2>
        <p className="auth-description">Bring residents, rooms, payments, and everyday requests together in one clear workspace.</p>
      </div>
      <p className="auth-footer">&copy; Smart Hostel</p>
    </section>
    <section className="auth-panel">{children}</section>
  </main>
}