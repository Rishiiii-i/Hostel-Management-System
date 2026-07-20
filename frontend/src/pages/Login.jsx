import { useState, useEffect } from 'react'
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

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [oobCode, setOobCode] = useState('')

  const { logInWithEmail, signUpWithEmail, logInWithGoogle, sendPasswordReset, verifyResetCode, confirmResetPassword } = useAuth()

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset' || Boolean(oobCode)

  useEffect(() => {
    const url = window.location.href
    let code = ''
    if (url.includes('oobCode=')) {
      const match = url.match(/oobCode=([^&#]+)/)
      if (match) code = decodeURIComponent(match[1])
    }
    if (code && verifyResetCode) {
      setOobCode(code)
      verifyResetCode(code)
        .then((emailAddress) => setResetEmail(emailAddress))
        .catch(() => setError('Invalid or expired password reset link.'))
    }
  }, [verifyResetCode])

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    setLoading(true)
    try {
      await confirmResetPassword(oobCode, newPassword, resetEmail)
      setSuccessMessage('Password has been updated successfully! Redirecting to sign in...')
      setTimeout(() => {
        window.location.href = '#login'
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      await sendPasswordReset(email)
      setSuccessMessage('Password reset link has been sent to your email!')
    } catch (err) {
      setError(err.message || 'Failed to request password reset')
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

  if (isReset) {
    return <div className="auth-card auth-card--forgot">
      <a className="auth-card-back" href="#login">&larr; Back to sign in</a>
      <div className="auth-card__top">
        <h1>Reset your password</h1>
        <p>{resetEmail ? `for ${resetEmail}` : 'Enter your new password below.'}</p>
      </div>

      {error && <div className="auth-error-message" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
      {successMessage && <div className="auth-success-message" style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{successMessage}</div>}

      <form className="auth-form" onSubmit={handleResetPasswordSubmit}>
        <label>
          NEW PASSWORD
          <div className="auth-password-input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Enter new password" 
              required 
              disabled={loading}
            />
            <button 
              type="button" 
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} width="18" height="18" />
            </button>
          </div>
        </label>

        <label>
          CONFIRM NEW PASSWORD
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Confirm new password" 
            required 
            disabled={loading}
          />
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'SAVE'}
        </button>
      </form>
    </div>
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

    {error && <div className="auth-error-message" style={{ color: '#ef4444', marginBottom: '1.25rem', fontSize: '0.875rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>{error}</div>}

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
              <Icon name="eye-off" width="18" height="18" />
            ) : (
              <Icon name="eye" width="18" height="18" />
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
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span> <span>{error}</span>
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