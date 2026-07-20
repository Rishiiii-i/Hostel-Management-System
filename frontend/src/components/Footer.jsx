import './Footer.css'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top-grid">
          <div className="footer-brand-col">
            <a className="footer-brand" href="#home">
              <span className="brand-icon-wrapper">
                <Icon name="building" width={20} height={20} />
              </span>
              <span className="brand-text">Smart<span className="brand-highlight">Hostel</span></span>
            </a>
            <p className="footer-tagline">
              A simple hostel management system for managing rooms, students, fees, attendance, and maintenance.
            </p>
          </div>

          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#process">How It Works</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-links-col">
            <h4>Contact</h4>
            <a href="mailto:rishi@shnoor.com">rishi@shnoor.com</a>
            <a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a>
            <a href="#contact" className="footer-feedback-btn">Send Feedback</a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright">&copy; 2026 Smart Hostel. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
