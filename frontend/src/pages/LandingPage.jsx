import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import ScrollReveal from '../components/ScrollReveal'

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
    <main id="home" className="overflow-x-hidden">
      <Navbar />
      
      <section className="hero">
        <div className="animate-fade-in-slide-up" style={{ animationFillMode: 'both' }}>
          <p className="label coral animate-fade-in-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>A Better Way to Manage Your Hostel</p>
          <h1 className="animate-fade-in-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>Simple hostel management<br />for <em>everyone</em></h1>
          <p className="animate-fade-in-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>Everything you need to manage rooms, students, fees, and requests in one place.</p>
          <div className="hero-actions animate-fade-in-slide-up" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
            <a className="button hover:-translate-y-1 hover:shadow-lg transition-all duration-300" href="#roles">Explore Smart Hostel <b>&rarr;</b></a>
            <a href="#process" className="secondary hover:text-[#1e6b51] transition-colors duration-300">See How It Works</a>
          </div>
        </div>
        <div className="hero-board animate-fade-in-slide-left" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <div className="board-head"><span>Today's Hostel Updates</span><i className="animate-pulse">Live Overview</i></div>
          <div className="board-numbers">
            <article className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm"><small>Students</small><b>328</b><span>+12 this week</span></article>
            <article className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm"><small>Available Rooms</small><b>16</b><span>Ready to assign</span></article>
          </div>
          <div className="board-list">
            <p className="transition-colors duration-200"><b></b> Fee reminder sent <small>just now</small></p>
            <p className="transition-colors duration-200"><b></b> Room 216 maintenance completed <small>12 min ago</small></p>
            <p className="transition-colors duration-200"><b></b> 8 visitor requests waiting <small>24 min ago</small></p>
          </div>
        </div>
      </section>

      <section className="section feature-section" id="features">
        <ScrollReveal animation="fade-up">
          <header>
            <p className="label violet">Features</p>
            <h2>Everything You Need<br />in One Place</h2>
            <p className="sub">Simple tools for administrators, wardens, and students.</p>
          </header>
        </ScrollReveal>
        <div className="feature-grid">
          {features.map(([icon, title, copy], i) => (
            <ScrollReveal key={title} animation="fade-up" delay={i * 100}>
              <article 
                onClick={() => window.location.hash = '#login'}
                className="group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#1e6b51]/30"
              >
                <span className={'icon-box box-' + i + ' group-hover:scale-110 transition-transform duration-300'}><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <a href="#login" className="group-hover:translate-x-1 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>Learn More <b>&rarr;</b></a>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="section process" id="process">
        <ScrollReveal animation="fade-up">
          <header>
            <p className="label violet">How It Works</p>
            <h2>Get Started in<br />3 Easy Steps</h2>
            <p className="sub">Set up your hostel and manage every day from one place.</p>
          </header>
        </ScrollReveal>
        <div className="step-grid">
          {steps.map(([icon, title, copy], i) => (
            <ScrollReveal key={title} animation="fade-up" delay={i * 150}>
              <article className="group transition-all duration-300 hover:scale-[1.03]">
                <div className="step-number group-hover:scale-110 group-hover:bg-[#1e6b51] transition-transform duration-300">{i + 1}</div>
                <span className="step-icon group-hover:rotate-6 transition-transform duration-300"><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="section roles" id="roles">
        <ScrollReveal animation="fade-up">
          <header>
            <p className="label pink">Dashboards</p>
            <h2>A Dashboard for<br />Every User</h2>
            <p className="sub">The right tools and information for every hostel role.</p>
          </header>
        </ScrollReveal>
        <div className="role-grid">
          {roles.map(([icon, title, copy], i) => (
            <ScrollReveal key={title} animation="fade-up" delay={i * 100}>
              <article className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#1e6b51]/30">
                <span className={'role-icon role-' + i + ' group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'}><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <a href="#login">View Dashboard <b>&rarr;</b></a>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="section stories">
        <ScrollReveal animation="fade-up">
          <header>
            <p className="label coral">Testimonials</p>
            <h2>Made for Everyday<br />Hostel Life</h2>
          </header>
        </ScrollReveal>
        <div className="story-grid">
          <ScrollReveal animation="fade-up" delay={0}>
            <article className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#1e6b51]/20">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&quot;I can check room status and pending work quickly. It saves a lot of time.&quot;</p>
              <div className="person">
                <b className="group-hover:bg-[#1e6b51] group-hover:text-white transition-colors duration-300">bd</b>
                <span><strong>Bale Dileep</strong><small>Residence Warden</small></span>
              </div>
            </article>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <article className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#1e6b51]/20">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&quot;Paying fees and checking notices is now simple and easy.&quot;</p>
              <div className="person">
                <b className="group-hover:bg-[#1e6b51] group-hover:text-white transition-colors duration-300">rm</b>
                <span><strong>Rishi Macha</strong><small>Student</small></span>
              </div>
            </article>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <article className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#1e6b51]/20">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&quot;Everything is in one place, so managing the hostel is much easier.&quot;</p>
              <div className="person">
                <b className="group-hover:bg-[#1e6b51] group-hover:text-white transition-colors duration-300">sk</b>
                <span><strong>Sade Kavya</strong><small>Hostel Administrator</small></span>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal animation="scale-up" className="w-full">
        <section className="final animate-float">
          <p className="label coral">Built for Every Hostel</p>
          <h2>Make hostel management<br />simple, fast, and organized.</h2>
          <a className="button light hover:-translate-y-1 hover:shadow-md transition-all duration-300" href="#signup">Get Started Today <b>&rarr;</b></a>
        </section>
      </ScrollReveal>

      <section className="contact-section" id="contact">
        <ScrollReveal animation="slide-right">
          <div className="contact-intro">
            <p className="label coral">Contact Us</p>
            <h2>Let&apos;s talk about<br />your hostel.</h2>
            <p>Tell us a little about your hostel and how we can help. Our team will get back to you soon.</p>
            <a href="mailto:rishi@snhoor.com" className="hover:text-[#1e6b51] transition-colors">rishi@snhoor.com</a>
            <a href="mailto:dileep@shnoor.com" className="hover:text-[#1e6b51] transition-colors">dileep@shnoor.com</a>
          </div>
        </ScrollReveal>
        <ScrollReveal animation="slide-left">
          <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
            <label>Name<input type="text" placeholder="Enter your name" className="focus:scale-[1.01] transition-all duration-300" required /></label>
            <label>Feedback<textarea placeholder="Write your feedback" className="focus:scale-[1.01] transition-all duration-300" required></textarea></label>
            <button className="button hover:-translate-y-1 hover:shadow-lg transition-all duration-300" type="submit">Submit <b>&rarr;</b></button>
          </form>
        </ScrollReveal>
      </section>

      <Footer />
    </main>
  )
}
