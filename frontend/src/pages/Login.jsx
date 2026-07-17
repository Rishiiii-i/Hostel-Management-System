import { useState } from 'react'

function getRole(email) {
  const value = email.toLowerCase()
  if (value.includes('admin')) return 'administrator'
  if (value.includes('warden')) return 'warden'
  return 'student'
}

export default function Login({ mode = 'login' }) {
  const [email, setEmail] = useState('')
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
        <button className="auth-submit" type="submit">Send reset link <b>&rarr;</b></button>
      </form>
    </div>
  }
  return <div className="auth-card">
    <a className="auth-card-back" href="#home">&larr; Back to home</a>
    <div className="auth-card__top">
      <h1>{isSignup ? 'Create your Smart Hostel account' : 'Welcome back'}</h1>
      <p>{isSignup ? 'Set up a calmer way to manage hostel life.' : 'Sign in to continue to your hostel workspace.'}</p>
    </div>

    <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
      {isSignup && <label>YOUR NAME<input type="text" placeholder="Enter your name" autoComplete="name" required /></label>}
      <label>EMAIL ADDRESS<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" required /></label>
      
      <label>PASSWORD<input type="password" placeholder="Enter your password" autoComplete={isSignup ? 'new-password' : 'current-password'} required /></label>
      {!isSignup && <a className="auth-forgot" href="#forgot-password">Forgot password?</a>}
      <button className="auth-submit" type="submit">{isSignup ? 'Sign up' : 'Sign in'} <b>&rarr;</b></button>
    </form>

    <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Smart Hostel?'} <a href={isSignup ? '#login' : '#signup'}>{isSignup ? 'Sign in' : 'Create an account'}</a></p>
  </div>
}