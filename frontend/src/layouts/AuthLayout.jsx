export default function AuthLayout({ children }) {
  return <main className="auth-page">
    <section className="auth-showcase">
      <a className="auth-brand" href="#home"><span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 21h16M6 21V5l6-3 6 3v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" /></svg></span> Smart Hostel</a>
      <div className="auth-showcase__content">
        <p className="auth-kicker">A CALMER WAY TO RUN YOUR HOSTEL</p>
        <h2>Make room for<br /><em>better hostel days.</em></h2>
        <p className="auth-description">Bring residents, rooms, payments, and everyday requests together in one clear, friendly workspace.</p>
        <div className="auth-stats"><div><b>328</b><span>residents</span></div><div><b>16</b><span>rooms open</span></div><div><b>24/7</b><span>clear overview</span></div></div>
      </div>
      <p className="auth-footer">&copy; 2026 Smart Hostel &middot; built for hostel life</p>
    </section>
    <section className="auth-panel">{children}</section>
  </main>
}