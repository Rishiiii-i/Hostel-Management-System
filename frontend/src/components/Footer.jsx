import './Footer.css'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer>
      <div>
        <a className="brand" href="#home">
          <span>
            <Icon name="building" />
          </span>
          {' '}Smart Hostel
        </a>
        <p>a simpler digital home for hostel operations and everyday community life</p>
      </div>
      <div>
        <h4>explore</h4>
        <a href="#home">home</a>
        <a href="#features">features</a>
        <a href="#roles">dashboards</a>
        <a href="#process">how it works</a>
        <a href="#contact">contacts</a>
      </div>
      <div>
        <h4>get in touch</h4>
        <a href="mailto:rishi@snhoor.com">rishi@snhoor.com</a>
        <a href="mailto:dileep@shnoor.com">dileep@shnoor.com</a>
      </div>
      <p className="copyright">&copy; 2026 Smart Hostel. All Rights Reserved.</p>
    </footer>
  )
}
