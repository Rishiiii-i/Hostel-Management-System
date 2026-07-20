import { useState } from 'react'
import './LandingPage.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import ScrollReveal from '../components/ScrollReveal'

const features = [
  {
    icon: 'user',
    title: 'Student Records',
    copy: 'Keep student details, contact information, room history, and documents in one place.',
    badge: 'Core'
  },
  {
    icon: 'fee',
    title: 'Fee Management',
    copy: 'Track hostel fees, send payment reminders, and generate digital receipts.',
    badge: 'Finance'
  },
  {
    icon: 'note',
    title: 'Maintenance Requests',
    copy: 'Students can report issues like plumbing, electricity, or Wi-Fi. Wardens can track and manage them easily.',
    badge: 'Support'
  },
  {
    icon: 'room',
    title: 'Room Management',
    copy: 'Assign rooms, check available beds, and manage room changes.',
    badge: 'Operations'
  },
  {
    icon: 'check',
    title: 'Attendance & Outpass',
    copy: 'Record attendance, approve leave requests, and track entry and exit.',
    badge: 'Security'
  },
  {
    icon: 'bell',
    title: 'Notice Board',
    copy: 'Share important notices, hostel rules, and updates with all students.',
    badge: 'Updates'
  }
]

const roleData = {
  admin: {
    title: 'Administrator',
    badge: 'User Roles',
    copy: 'Manage hostel settings, fees, staff, students, and reports from one dashboard.',
    highlights: ['View fee reports', 'Manage room allocation', 'Control staff access', 'Export data']
  },
  warden: {
    title: 'Warden',
    badge: 'User Roles',
    copy: 'Real-time tools for daily room inspections, attendance tracking, gate passes approval, and resolving student complaints.',
    highlights: ['Live Nightly Attendance Log', 'Maintenance Work Order Management', 'Outpass Approval Requests', 'Emergency Contact Quick Dial']
  },
  student: {
    title: 'Student',
    badge: 'User Roles',
    copy: 'Empower students to check dues, pay fees digitally, log repair tickets, check food menus, and read official notices.',
    highlights: ['Instant Fee Payment Receipts', 'Track Complaint Resolution Status', 'Digital Outpass Requests', 'Hostel Notice Feed']
  }
}

const steps = [
  {
    step: '01',
    icon: 'building',
    title: 'Register Your Hostel',
    copy: 'Add your hostel details, blocks, rooms, and fee information.'
  },
  {
    step: '02',
    icon: 'user',
    title: 'Add Staff and Students',
    copy: 'Upload student data or let students register online. Add wardens and staff.'
  },
  {
    step: '03',
    icon: 'attendance',
    title: 'Manage Daily Work',
    copy: 'Track fees, attendance, maintenance requests, and room allocation from one dashboard.'
  }
]

const testimonials = [
  {
    stars: 5,
    quote: "Smart Hostel made room management and fee collection much easier. It saves us a lot of time.",
    author: "Bale Dileep",
    role: "Hostel Warden",
    initials: "BD"
  },
  {
    stars: 5,
    quote: "Now I can pay hostel fees and report problems from my phone without visiting the office.",
    author: "Rishi Macha",
    role: "Engineering Student",
    initials: "RM"
  },
  {
    stars: 5,
    quote: "The dashboard helps us manage rooms, students, and maintenance requests very easily.",
    author: "Sade Kavya",
    role: "Hostel Director",
    initials: "SK"
  }
]

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState('admin')
  const [heroBoardTab, setHeroBoardTab] = useState('overview')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleContactSubmit = (e) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => setFormSubmitted(false), 5000)
  }

  return (
    <main id="home" className="landing-page-root">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="hero-title">
                Manage Your Hostel <span className="highlight-text">Easily</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <p className="hero-subtitle">
                Everything you need to manage rooms, students, fees, and maintenance in one simple system.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={300}>
              <div className="hero-actions">
                <a className="btn-primary" href="#login">
                  <span>Get Started</span>
                  <Icon name="room" width={16} height={16} />
                </a>
                <a href="#features" className="btn-secondary">
                  <span>Explore Features</span>
                  <Icon name="search" width={16} height={16} />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={400}>
              <div className="hero-guarantees">
                <span><Icon name="checkmark" width={16} height={16} /> Easy to Set Up</span>
                <span><Icon name="checkmark" width={16} height={16} /> Secure Cloud Backup</span>
                <span><Icon name="checkmark" width={16} height={16} /> 24/7 Support</span>
              </div>
            </ScrollReveal>
          </div>

          <div className="hero-board-wrapper">
            <ScrollReveal animation="slide-left" delay={200}>
              <div className="hero-board-card">
                <div className="board-top-bar">
                  <div className="board-tabs">
                    <button 
                      className={`board-tab-btn ${heroBoardTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setHeroBoardTab('overview')}
                    >
                      Live Dashboard
                    </button>
                    <button 
                      className={`board-tab-btn ${heroBoardTab === 'activity' ? 'active' : ''}`}
                      onClick={() => setHeroBoardTab('activity')}
                    >
                      Recent Updates
                    </button>
                  </div>
                  <span className="live-status-pill">
                    <span className="pulse-dot"></span> Live Dashboard
                  </span>
                </div>

                {heroBoardTab === 'overview' ? (
                  <div className="board-content-overview">
                    <div className="board-stats-row">
                      <article className="stat-box emerald">
                        <small>Total Students</small>
                        <b>328</b>
                        <span className="stat-trend">+12 this week</span>
                      </article>
                      <article className="stat-box amber">
                        <small>Available Beds</small>
                        <b>16</b>
                        <span className="stat-sub">Ready to assign</span>
                      </article>
                    </div>

                    <div className="board-progress-section">
                      <div className="progress-info">
                        <span>Fee Collection</span>
                        <strong>94.2%</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: '94.2%' }}></div>
                      </div>
                    </div>

                    <div className="board-feed">
                      <div className="feed-item">
                        <span className="feed-dot active"></span>
                        <div className="feed-text">
                          <p><strong>Room 204</strong> fee payment received</p>
                          <small>2 minutes ago</small>
                        </div>
                      </div>
                      <div className="feed-item">
                        <span className="feed-dot pending"></span>
                        <div className="feed-text">
                          <p><strong>Block B AC</strong> maintenance request received</p>
                          <small>15 minutes ago</small>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="board-content-activity">
                    <div className="activity-list">
                      <div className="activity-card">
                        <span className="activity-icon"><Icon name="fee" width={18} height={18} /></span>
                        <div>
                          <p>Room 204 fee payment received &ndash; 2 minutes ago</p>
                          <small>Just now &bull; Automated System</small>
                        </div>
                      </div>
                      <div className="activity-card">
                        <span className="activity-icon"><Icon name="room" width={18} height={18} /></span>
                        <div>
                          <p>Block B AC maintenance request received &ndash; 15 minutes ago</p>
                          <small>15 minutes ago &bull; Warden Dileep</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-wrapper" id="features">
        <ScrollReveal animation="fade-up">
          <div className="section-header text-center">
            <span className="section-eyebrow">Features</span>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">Simple tools to help hostel admins, wardens, and students manage daily hostel work.</p>
          </div>
        </ScrollReveal>

        <div className="features-grid">
          {features.map((item, i) => (
            <ScrollReveal key={item.title} animation="fade-up" delay={i * 80}>
              <div className="feature-card group">
                <div className="feature-top">
                  <div className="feature-icon-wrapper">
                    <Icon name={item.icon} width={24} height={24} />
                  </div>
                  <span className="feature-category-badge">{item.badge}</span>
                </div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-copy">{item.copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Interactive Role Dashboards Section */}
      <section className="section-wrapper roles-section" id="roles">
        <ScrollReveal animation="fade-up">
          <div className="section-header text-center">
            <span className="section-eyebrow">User Roles</span>
            <h2 className="section-title">Made for Everyone</h2>
            <p className="section-subtitle">Different dashboards for administrators, wardens, and students.</p>
          </div>
        </ScrollReveal>

        <div className="role-switcher-container">
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="role-tabs-header">
              <button 
                className={`role-tab-btn ${activeRole === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveRole('admin')}
              >
                <Icon name="building" width={18} height={18} /> Administrator
              </button>
              <button 
                className={`role-tab-btn ${activeRole === 'warden' ? 'active' : ''}`}
                onClick={() => setActiveRole('warden')}
              >
                <Icon name="users" width={18} height={18} /> Warden
              </button>
              <button 
                className={`role-tab-btn ${activeRole === 'student' ? 'active' : ''}`}
                onClick={() => setActiveRole('student')}
              >
                <Icon name="user" width={18} height={18} /> Student
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale-up" delay={200}>
            <div className="role-display-card">
              <div className="role-card-left">
                <span className="role-badge">{roleData[activeRole].badge}</span>
                <h3>{roleData[activeRole].title}</h3>
                <p>{roleData[activeRole].copy}</p>
                <ul className="role-highlights-list">
                  {roleData[activeRole].highlights.map((h, idx) => (
                    <li key={idx}><Icon name="checkmark" width={16} height={16} /> {h}</li>
                  ))}
                </ul>
                <a href="#login" className="btn-role-action">
                  <span>Open {roleData[activeRole].title} Dashboard</span>
                  <Icon name="user" width={16} height={16} />
                </a>
              </div>
              <div className="role-card-right">
                <div className="role-mock-window">
                  <div className="window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="window-title">{roleData[activeRole].title} Preview</span>
                  </div>
                  <div className="window-content">
                    <div className="mock-stat-grid">
                      <div className="mock-box">
                        <small>Success Rate</small>
                        <b>99.4%</b>
                      </div>
                      <div className="mock-box">
                        <small>Pending Tasks</small>
                        <b>3</b>
                      </div>
                    </div>
                    <div className="mock-list-item">
                      <span className="mock-avatar"></span>
                      <div>
                        <strong>System Status</strong>
                        <small>All data is up to date.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-wrapper process-section" id="process">
        <ScrollReveal animation="fade-up">
          <div className="section-header text-center">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">Start in 3 Simple Steps</h2>
            <p className="section-subtitle">No long onboarding calls or complex hardware installation required.</p>
          </div>
        </ScrollReveal>

        <div className="steps-grid">
          {steps.map((st, i) => (
            <ScrollReveal key={st.step} animation="fade-up" delay={i * 120}>
              <div className="step-card">
                <div className="step-badge">{st.step}</div>
                <div className="step-icon-box">
                  <Icon name={st.icon} width={26} height={26} />
                </div>
                <h3>{st.title}</h3>
                <p>{st.copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-wrapper stories-section">
        <ScrollReveal animation="fade-up">
          <div className="section-header text-center">
            <span className="section-eyebrow">Reviews</span>
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">See why wardens and students love using Smart Hostel every day.</p>
          </div>
        </ScrollReveal>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.author} animation="fade-up" delay={i * 100}>
              <div className="testimonial-card">
                <div className="stars-row">
                  {'★'.repeat(t.stars)}
                </div>
                <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                <div className="author-info">
                  <div className="author-avatar">{t.initials}</div>
                  <div>
                    <strong className="author-name">{t.author}</strong>
                    <small className="author-role">{t.role}</small>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="final-cta-section">
        <div className="final-cta-container">
          <ScrollReveal animation="scale-up">
            <div className="final-cta-card">
              <span className="cta-eyebrow">Call to Action</span>
              <h2>Manage Your Hostel Smarter</h2>
              <p>Make hostel management simple and organized.</p>
              <div className="cta-buttons">
                <a className="btn-cta-white" href="#signup">
                  Create Free Account &rarr;
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <ScrollReveal animation="slide-right">
            <div className="contact-info-side">
              <span className="section-eyebrow">Contact Us</span>
              <h2>We&apos;re Here to Help</h2>
              <p>Have questions about the system or pricing? Contact our team anytime.</p>

              <div className="contact-cards-list">
                <div className="contact-item-card">
                  <span className="contact-icon"><Icon name="building" width={20} height={20} /></span>
                  <div>
                    <strong>Email Support</strong>
                    <a href="mailto:rishi@shnoor.com">rishi@shnoor.com</a> &bull; <a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a>
                  </div>
                </div>
                <div className="contact-item-card">
                  <span className="contact-icon"><Icon name="user" width={20} height={20} /></span>
                  <div>
                    <strong>Support Hours</strong>
                    <p>Monday to Saturday &bull; 9:00 AM &ndash; 7:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-left">
            <div className="contact-form-side">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <h3>Send Us a Message</h3>
                {formSubmitted && (
                  <div className="form-success-alert">
                    ✓ Thank you! Your message has been sent successfully.
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="contact-name">Your Name</label>
                  <input id="contact-name" type="text" placeholder="Enter your name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email Address</label>
                  <input id="contact-email" type="email" placeholder="Enter your email address" required />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea id="contact-message" rows={4} placeholder="Enter your message..." required></textarea>
                </div>
                <button type="submit" className="btn-submit-contact">
                  Send Message &rarr;
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  )
}
