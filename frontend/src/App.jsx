import { useEffect, useState } from 'react'
import AuthLayout from './layouts/AuthLayout'
import Login from './pages/Login'

const iconPaths = {
  users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.5-3.4 2.3-5.3 5.5-5.3s5 1.9 5.5 5.3M16 14.5c2.5.4 3.8 2.2 4 5.1"/></>,
  fee: <><path d="M5 4h11M5 8h14M8 4v16M7 13h9M7 17h7"/><path d="M17 4c0 3 3 3 3 6s-3 3-3 6"/></>,
  note: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  room: <><path d="M3 18V9a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v5M3 14h18v4M7 18v2M17 18v2M12 10h6a3 3 0 0 1 3 3v1"/></>,
  login: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="m10 16 4-4-4-4M14 12H3"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  check: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 12 2.2 2.2L16 8.5M8 17h8"/></>,
  building: <><path d="M4 21h16M6 21V5l6-3 6 3v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></>
}
const Icon = ({ name }) => <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{iconPaths[name]}</svg>

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

function App() {
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  if (route === '#login' || route === '#signup' || route === '#forgot-password') {
    const mode = route === '#signup' ? 'signup' : route === '#forgot-password' ? 'forgot' : 'login'
    return <AuthLayout><Login mode={mode} /></AuthLayout>
  }

  return <main>
    <nav className="nav"><a className="brand" href="#home"><span><Icon name="building" /></span> homi</a><div className="nav-links"><a href="#home">home</a><a href="#features">features</a><a href="#roles">roles</a><a href="#process">how it works</a><a href="#contact">contacts</a></div><a className="login" href="#login">sign in <b>→</b></a></nav>
    <section className="hero" id="home"><div><p className="label coral">A Better Way to Manage Your Hostel</p><h1>Simple hostel management<br />for <em>everyone</em></h1><p>Everything you need to manage rooms, students, fees, and requests in one place.</p><div className="hero-actions"><a className="button" href="#roles">Explore Homi <b>&rarr;</b></a><a href="#process" className="secondary">See How It Works</a></div></div><div className="hero-board"><div className="board-head"><span>Today's Hostel Updates</span><i>Live Overview</i></div><div className="board-numbers"><article><small>Students</small><b>328</b><span>+12 this week</span></article><article><small>Available Rooms</small><b>16</b><span>Ready to assign</span></article></div><div className="board-list"><p><b></b> Fee reminder sent <small>just now</small></p><p><b></b> Room 216 maintenance completed <small>12 min ago</small></p><p><b></b> 8 visitor requests waiting <small>24 min ago</small></p></div></div></section>
    <section className="section feature-section" id="features"><header><p className="label violet">Features</p><h2>Everything You Need<br />in One Place</h2><p className="sub">Simple tools for administrators, wardens, and students.</p></header><div className="feature-grid">{features.map(([icon,title,copy],i)=><article key={title}><span className={'icon-box box-'+i}><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p><a href={'#feature-'+i}>Learn More <b>&rarr;</b></a></article>)}</div></section>
    <section className="section process" id="process"><header><p className="label violet">How It Works</p><h2>Get Started in<br />3 Easy Steps</h2><p className="sub">Set up your hostel and manage every day from one place.</p></header><div className="step-grid">{steps.map(([icon,title,copy],i)=><article key={title}><div className="step-number">{i+1}</div><span className="step-icon"><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="section roles" id="roles"><header><p className="label pink">Dashboards</p><h2>A Dashboard for<br />Every User</h2><p className="sub">The right tools and information for every hostel role.</p></header><div className="role-grid">{roles.map(([icon,title,copy],i)=><article key={title}><span className={'role-icon role-'+i}><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p><a href="#login">View Dashboard <b>&rarr;</b></a></article>)}</div></section>
    <section className="section stories"><header><p className="label coral">Testimonials</p><h2>Made for Everyday<br />Hostel Life</h2></header><div className="story-grid"><article><div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>&quot;I can check room status and pending work quickly. It saves a lot of time.&quot;</p><div className="person"><b>bd</b><span><strong>Bale Dileep</strong><small>Residence Warden</small></span></div></article><article><div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>&quot;Paying fees and checking notices is now simple and easy.&quot;</p><div className="person"><b>rm</b><span><strong>Rishi Macha</strong><small>Student</small></span></div></article><article><div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>&quot;Everything is in one place, so managing the hostel is much easier.&quot;</p><div className="person"><b>sk</b><span><strong>Sade Kavya</strong><small>Hostel Administrator</small></span></div></article></div></section>
    <section className="final"><p className="label coral">Built for Every Hostel</p><h2>Make hostel management<br />simple, fast, and organized.</h2><a className="button light" href="#signup">Get Started Today <b>&rarr;</b></a></section>
    <section className="contact-section" id="contact">
      <div className="contact-intro"><p className="label coral">Contact Us</p><h2>Let&apos;s talk about<br />your hostel.</h2><p>Tell us a little about your hostel and how we can help. Our team will get back to you soon.</p><a href="mailto:rishi@snhoor.com">rishi@snhoor.com</a><a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a></div>
      <form className="contact-form" onSubmit={(event) => event.preventDefault()}><label>Name<input type="text" placeholder="Enter your name" required /></label><label>Feedback<textarea placeholder="Write your feedback" required></textarea></label><button className="button" type="submit">Submit <b>&rarr;</b></button></form>
    </section><footer><div><a className="brand" href="#home"><span><Icon name="building" /></span> homi</a><p>a simpler digital home for hostel operations and everyday community life</p></div><div><h4>explore</h4><a href="#home">home</a><a href="#features">features</a><a href="#roles">dashboards</a><a href="#process">how it works</a><a href="#contact">contacts</a></div><div><h4>get in touch</h4><a href="mailto:rishi@snhoor.com">rishi@snhoor.com</a><a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a></div><p className="copyright">&copy; 2026 Homi. All Rights Reserved.</p></footer>
  </main>
}
export default App