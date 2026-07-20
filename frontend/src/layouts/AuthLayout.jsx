export default function AuthLayout({ children }) {
  return <main className="auth-page">
    <section className="auth-showcase">
      <a className="auth-brand" href="#home">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M2 22h20M10 8h.01M14 8h.01M10 12h.01M14 12h.01M10 16h.01M14 16h.01" />
          </svg>
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