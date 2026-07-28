import { useState } from 'react'
import './Footer.css'
import Icon from './Icon'

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null)
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
            <div className="footer-socials">
              <a href="https://www.linkedin.com/in/rishimacha/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn">
                <Icon name="linkedin" width={18} height={18} />
              </a>
              <a href="https://github.com/Dileep-Kumar-D4" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="GitHub">
                <Icon name="github" width={18} height={18} />
              </a>
            </div>
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
          <div className="footer-bottom-links">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="footer-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="footer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="footer-modal-header">
              <h3>{activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h3>
              <button className="footer-modal-close" onClick={() => setActiveModal(null)}>
                &times;
              </button>
            </div>
            <div className="footer-modal-body">
              {activeModal === 'privacy' ? (
                <>
                  <p className="modal-lead">Last Updated: July 2026</p>
                  <section>
                    <h4>1. Introduction</h4>
                    <p>Welcome to Smart Hostel.</p>
                    <p>We care about your privacy and work to keep your personal information safe. This policy explains what information we collect, how we use it, and how we protect it. If you have any questions, please contact us.</p>
                  </section>
                  <section>
                    <h4>2. Information We Collect</h4>
                    <p>When you register on Smart Hostel, we may collect the following information:</p>
                    <ul>
                      <li><strong>Personal Information:</strong> Full name, roll number, photo, room number, and hostel block.</li>
                      <li><strong>Contact Information:</strong> Email address, phone number, and emergency contact.</li>
                      <li><strong>Login Information:</strong> Password and login details.</li>
                      <li><strong>Hostel Information:</strong> Attendance records, gate pass history, fee status, and maintenance or complaint requests.</li>
                    </ul>
                  </section>
                  <section>
                    <h4>3. How We Use Your Information</h4>
                    <p>We use your information to:</p>
                    <ul>
                      <li>Manage room allocation and attendance.</li>
                      <li>Track hostel fees and payment status.</li>
                      <li>Handle maintenance requests and complaints.</li>
                      <li>Send important notifications and hostel announcements.</li>
                    </ul>
                  </section>
                  <section>
                    <h4>4. Data Security</h4>
                    <p>We take steps to keep your information safe. Your data is stored securely using Firebase authentication and encryption. However, no online system is completely secure, so we cannot guarantee 100% security.</p>
                  </section>
                  <section>
                    <h4>5. Contact Us</h4>
                    <p>If you have any questions about this Privacy Policy, you can contact us at:</p>
                    <ul>
                      <li><a href="mailto:rishi@shnoor.com">rishi@shnoor.com</a></li>
                      <li><a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a></li>
                    </ul>
                  </section>
                </>
              ) : (
                <>
                  <p className="modal-lead">Last Updated: July 2026</p>
                  <section>
                    <h4>1. Agreement</h4>
                    <p>By using the Smart Hostel Management System, you agree to follow these Terms of Service. If you do not agree with these terms, please do not register or use the platform.</p>
                  </section>
                  <section>
                    <h4>2. User Accounts</h4>
                    <p>To use the platform, you must register as a <strong>Student</strong>, <strong>Warden</strong>, or <strong>Administrator</strong>.</p>
                    <p>You agree to:</p>
                    <ul>
                      <li>Provide correct and complete information.</li>
                      <li>Keep your password safe.</li>
                      <li>Be responsible for everything done using your account.</li>
                    </ul>
                  </section>
                  <section>
                    <h4>3. Proper Use</h4>
                    <p>You must use the platform in a safe and responsible way. You must not:</p>
                    <ul>
                      <li>Hack, damage, or interrupt the system.</li>
                      <li>Provide false information about attendance, gate passes, or fee payments.</li>
                      <li>Post abusive, offensive, or inappropriate messages in complaints or feedback.</li>
                    </ul>
                  </section>
                  <section>
                    <h4>4. Changes to the System</h4>
                    <p>The hostel administration may update, change, or stop any part of the system at any time. The system is provided as it is, and we cannot guarantee that it will always work without problems.</p>
                  </section>
                  <section>
                    <h4>5. Rules and Regulations</h4>
                    <p>These terms follow the rules of the hostel management and the institution. By using the platform, you agree to follow these rules.</p>
                  </section>
                </>
              )}
            </div>
            <div className="footer-modal-footer">
              <button className="footer-modal-btn" onClick={() => setActiveModal(null)}>I Understand</button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
