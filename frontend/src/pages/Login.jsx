import { useState } from 'react'
import GoogleSignInButton from '../components/GoogleSignInButton'
import Icon from '../components/Icon'

function getRole(email) {
  const value = email.toLowerCase()
  if (value.includes('admin')) return 'administrator'
  if (value.includes('warden')) return 'warden'
  return 'student'
}

export default function Login({ mode = 'login' }) {
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const role = getRole(email)
  const roleName = role[0].toUpperCase() + role.slice(1)

  if (isForgot) {
    return <div className="auth-card auth-card--forgot">
      <a className="auth-card-back" href="#login">&larr; Back to sign in</a>
      <div className="auth-card__top">
        <h1>Forgot password?</h1>
        <p>Enter your registered email address and we will send password reset instructions.</p>
      </div>
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <label>REGISTERED EMAIL ADDRESS<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" required /></label>
        <button className="auth-submit" type="submit">Send reset link</button>
      </form>
    </div>
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    window.location.hash = '#dashboard'
  }

  const handleGoogleClick = () => {
    window.location.hash = '#dashboard'
  }

  return <div className={`auth-card ${isSignup ? 'auth-card--signup' : ''}`}>
    <a className="auth-card-back" href="#home">&larr; Back to home</a>
    <div className="auth-card__top">
      <h1>{isSignup ? 'Create your Smart Hostel account' : 'Welcome back'}</h1>
      <p>{isSignup ? 'Set up a calmer way to manage hostel life.' : 'Sign in to continue to your hostel workspace.'}</p>
    </div>

    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup && (
        <>
          <label>YOUR NAME<input type="text" placeholder="Enter your name" autoComplete="name" required /></label>
          <label>REGISTERED ROLL NUMBER<input type="text" placeholder="Enter your roll number" required /></label>
        </>
      )}
      <label>EMAIL ADDRESS<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" required /></label>
      
      <div className="auth-password-container">
        <label className="auth-password-label">
          <span>PASSWORD</span>
          {!isSignup && <a className="auth-forgot" href="#forgot-password">Forgot password?</a>}
        </label>
        <div className="auth-password-input-wrapper">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter your password" 
            autoComplete={isSignup ? 'new-password' : 'current-password'} 
            required 
          />
          <button 
            type="button" 
            className="auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Icon name="eye-off" width="18" height="18" />
            ) : (
              <Icon name="eye" width="18" height="18" />
            )}
          </button>
        </div>
      </div>
      <button className="auth-submit" type="submit">{isSignup ? 'Sign up' : 'Sign in'}</button>
    </form>

    <div className="auth-divider">
      <span>OR</span>
    </div>

    <GoogleSignInButton 
      text={isSignup ? 'Sign up with Google' : 'Sign in with Google'} 
      onClick={handleGoogleClick}
    />

    <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Smart Hostel?'} <a href={isSignup ? '#login' : '#signup'}>{isSignup ? 'Sign in' : 'Create an account'}</a></p>
  </div>
}