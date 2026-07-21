import './Login.css'
import { useState } from 'react'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function Login({ mode = 'login' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rollNo, setRollNo] = useState('')

  const { logInWithEmail, signUpWithEmail, logInWithGoogle, sendPasswordReset } = useAuth()

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Trim whitespace
    const trimmedEmail = email.trim()

    // Email validation: Reject empty email
    if (!trimmedEmail) {
      setError('Email address is required.')
      return
    }

    // Email validation: Reject invalid email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await sendPasswordReset(trimmedEmail)
      setSuccessMessage('Password reset email has been sent successfully. Please check your Inbox and Spam folder.')
      setEmail('') // Clear the email input

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.hash = '#login'
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      // Map Firebase error codes to user-friendly messages
      if (err.code === 'auth/user-not-found') {
        setError('No account exists with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/missing-email') {
        setError('Email address is required.')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.code === 'auth/internal-error') {
        setError('Firebase encountered an internal error.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signUpWithEmail(name, email, password, rollNo)
      } else {
        await logInWithEmail(email, password)
      }
      window.location.hash = '#dashboard'
    } catch (err) {
      console.error('Auth error:', err?.code, err?.message)
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email & Password sign-in is currently disabled in your Firebase console. Please go to Authentication -> Sign-in method in your Firebase console and enable Email/Password.')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use by another account.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.')
      } else if (!isSignup) {
        setError('Wrong password. Please check your password and try again.')
      } else {
        setError(err.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = async () => {
    setError('')
    setLoading(true)
    try {
      await logInWithGoogle()
      window.location.hash = '#dashboard'
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is currently disabled in your Firebase console. Please go to Authentication -> Sign-in method and enable Google.')
      } else {
        setError(err.message || 'Google sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }



  if (isForgot) {
    return <div className="auth-card auth-card--forgot">
      <a className="auth-card-back" href="#login">&larr; Back to sign in</a>
      <div className="auth-card__top">
        <h1>Forgot password?</h1>
        <p>Enter your registered email address and we will send password reset instructions.</p>
      </div>
      {error && <div className="auth-error-message" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
      {successMessage && <div className="auth-success-message" style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem' }}>{successMessage}</div>}

      <form className="auth-form" onSubmit={handleForgotSubmit}>
        <label>
          REGISTERED EMAIL ADDRESS
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
            disabled={loading}
          />
        </label>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
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
          <label>
            YOUR NAME
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
              disabled={loading}
            />
          </label>
          <label>
            REGISTERED ROLL NUMBER
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter your roll number"
              required
              disabled={loading}
            />
          </label>
        </>
      )}
      <label>
        EMAIL ADDRESS
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
          disabled={loading}
        />
      </label>

      <div className="auth-password-container">
        <label className="auth-password-label">
          <span>PASSWORD</span>
          {!isSignup && <a className="auth-forgot" href="#forgot-password">Forgot password?</a>}
        </label>
        <div className="auth-password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            disabled={loading}
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={loading}
          >
            {showPassword ? (
              <Icon name="eye-off" width={20} height={20} />
            ) : (
              <Icon name="eye" width={20} height={20} />
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="auth-error-message" style={{
          color: '#dc2626',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '0.875rem',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? (isSignup ? 'Signing up...' : 'Signing in...') : (isSignup ? 'Sign up' : 'Sign in')}
      </button>
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