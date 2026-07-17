import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'

const features = [
  ['users', 'Student Records', 'Store student details, documents, and emergency contacts safely.'],
  ['fee', 'Fees and Payments', 'Track fees, send reminders, and manage payments easily.'],
  ['note', 'Requests and Notices', 'Manage complaints, maintenance requests, and announcements in one place.'],
  ['room', 'Rooms and Allocation', 'Assign rooms, check available beds, and manage room details.']
]
const roles = [
  ['building', 'Administrator', 'Manage students, rooms, fees, and hostel activities from one place.'],
  ['chart', 'Warden', 'Track attendance, room checks, visitors, and student requests.'],
  ['check', 'Student', 'View room details, pay fees, submit requests, and receive notices.']
]
const steps = [
  ['login', 'Create Your Hostel', 'Add your hostel details, invite your team, and set user roles.'],
  ['chart', 'Add Hostel Information', 'Add students, rooms, fees, and other important records.'],
  ['check', 'Manage Every Day', 'Track fees, requests, and daily updates from one dashboard.']
]

export default function LandingPage() {
  return (
    <main id="home">
      <Navbar />
      
      <section className="hero">
        <div>
          <p className="label coral">A Better Way to Manage Your Hostel</p>
          <h1>Simple hostel management<br />for <em>everyone</em></h1>
          <p>Everything you need to manage rooms, students, fees, and requests in one place.</p>
          <div className="hero-actions">
            <a className="button" href="#roles">Explore Smart Hostel <b>&rarr;</b></a>
            <a href="#process" className="secondary">See How It Works</a>
          </div>
        </div>
        <div className="hero-board">
          <div className="board-head"><span>Today's Hostel Updates</span><i>Live Overview</i></div>
          <div className="board-numbers">
            <article><small>Students</small><b>328</b><span>+12 this week</span></article>
            <article><small>Available Rooms</small><b>16</b><span>Ready to assign</span></article>
          </div>
          <div className="board-list">
            <p><b></b> Fee reminder sent <small>just now</small></p>
            <p><b></b> Room 216 maintenance completed <small>12 min ago</small></p>
            <p><b></b> 8 visitor requests waiting <small>24 min ago</small></p>
          </div>
        </div>
      </section>

      <section className="section feature-section" id="features">
        <header>
          <p className="label violet">Features</p>
          <h2>Everything You Need<br />in One Place</h2>
          <p className="sub">Simple tools for administrators, wardens, and students.</p>
        </header>
        <div className="feature-grid">
          {features.map(([icon, title, copy], i) => (
            <article key={title}>
              <span className={'icon-box box-' + i}><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <a href={'#feature-' + i}>Learn More <b>&rarr;</b></a>
            </article>
          ))}
        </div>
      </section>

      <section className="section process" id="process">
        <header>
          <p className="label violet">How It Works</p>
          <h2>Get Started in<br />3 Easy Steps</h2>
          <p className="sub">Set up your hostel and manage every day from one place.</p>
        </header>
        <div className="step-grid">
          {steps.map(([icon, title, copy], i) => (
            <article key={title}>
              <div className="step-number">{i + 1}</div>
              <span className="step-icon"><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section roles" id="roles">
        <header>
          <p className="label pink">Dashboards</p>
          <h2>A Dashboard for<br />Every User</h2>
          <p className="sub">The right tools and information for every hostel role.</p>
        </header>
        <div className="role-grid">
          {roles.map(([icon, title, copy], i) => (
            <article key={title}>
              <span className={'role-icon role-' + i}><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <a href="#login">View Dashboard <b>&rarr;</b></a>
            </article>
          ))}
        </div>
      </section>

      <section className="section stories">
        <header>
          <p className="label coral">Testimonials</p>
          <h2>Made for Everyday<br />Hostel Life</h2>
        </header>
        <div className="story-grid">
          <article>
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&quot;I can check room status and pending work quickly. It saves a lot of time.&quot;</p>
            <div className="person"><b>bd</b><span><strong>Bale Dileep</strong><small>Residence Warden</small></span></div>
          </article>
          <article>
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&quot;Paying fees and checking notices is now simple and easy.&quot;</p>
            <div className="person"><b>rm</b><span><strong>Rishi Macha</strong><small>Student</small></span></div>
          </article>
          <article>
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&quot;Everything is in one place, so managing the hostel is much easier.&quot;</p>
            <div className="person"><b>sk</b><span><strong>Sade Kavya</strong><small>Hostel Administrator</small></span></div>
          </article>
        </div>
      </section>

      <section className="final">
        <p className="label coral">Built for Every Hostel</p>
        <h2>Make hostel management<br />simple, fast, and organized.</h2>
        <a className="button light" href="#signup">Get Started Today <b>&rarr;</b></a>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-intro">
          <p className="label coral">Contact Us</p>
          <h2>Let&apos;s talk about<br />your hostel.</h2>
          <p>Tell us a little about your hostel and how we can help. Our team will get back to you soon.</p>
          <a href="mailto:rishi@snhoor.com">rishi@snhoor.com</a>
          <a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a>
        </div>
        <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
          <label>Name<input type="text" placeholder="Enter your name" required /></label>
          <label>Feedback<textarea placeholder="Write your feedback" required></textarea></label>
          <button className="button" type="submit">Submit <b>&rarr;</b></button>
        </form>
      </section>

      <Footer />
    </main>
  )
}
