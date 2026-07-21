import './Login.css'
import { useState, useEffect } from 'react'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function Login({ mode = 'login', oobCode = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rollNo, setRollNo] = useState('')

  // New state variables for password reset flow
  const [emailForReset, setEmailForReset] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)

  const { 
    logInWithEmail, 
    signUpWithEmail, 
    logInWithGoogle, 
    sendPasswordReset, 
    verifyResetCode, 
    confirmReset 
  } = useAuth()

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'

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
      // 1. Verify if the user exists in our MongoDB database first
      const verifyResponse = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw { code: 'auth/user-not-found', message: errorData.message || 'User with this email was not found' }
      }

      // 2. Since user exists in our DB, trigger Firebase's password reset email
      await sendPasswordReset(trimmedEmail)
      setSuccessMessage('Password reset email has been sent successfully. Please check your Inbox and Spam folder.')
      setEmail('') // Clear the email input

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.hash = '#login'
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      
      // If it's our thrown custom error/DB verification failure or Firebase error
      if (err.code === 'auth/user-not-found') {
        setError(err.message || 'No account exists with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/missing-email') {
        setError('Email address is required.')
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Network error or server is offline. Please check your connection and try again.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.code === 'auth/internal-error') {
        setError('Firebase encountered an internal error.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Clear error and success messages when changing modes (login/signup/forgot/reset)
  useEffect(() => {
    setError('')
    setSuccessMessage('')
  }, [mode])

  useEffect(() => {
    if (isReset) {
      if (!oobCode) {
        setError('No password reset code was provided. Please request a new link.')
        return
      }
      const verifyCode = async () => {
        setVerifyingCode(true)
        setError('')
        try {
          const email = await verifyResetCode(oobCode)
          setEmailForReset(email)
        } catch (err) {
          console.error('Verify reset code error:', err)
          setError('This password reset link is invalid or has expired. Please request a new one.')
        } finally {
          setVerifyingCode(false)
        }
      }
      verifyCode()
    }
  }, [isReset, oobCode, verifyResetCode])

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!password) {
      setError('Please enter a new password.')
      return
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await confirmReset(oobCode, password)
      setSuccessMessage('Your password has been successfully reset! Redirecting to login...')
      setPassword('')
      setConfirmPassword('')

      // Clean up the URL search params so they don't reload back into reset-password mode
      window.history.replaceState({}, document.title, window.location.pathname)

      setTimeout(() => {
        window.location.hash = '#login'
      }, 3000)
    } catch (err) {
      console.error('Password reset confirmation error:', err)
      if (err.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new password reset email.')
      } else if (err.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid. Please make sure the URL matches the link sent to your email.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.')
      } else {
        setError('Failed to reset password. Please try again.')
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
      let res;
      if (isSignup) {
        res = await signUpWithEmail(name, email, password, rollNo)
      } else {
        res = await logInWithEmail(email, password)
      }

      const role = res?.user?.role || ''
      if (role === 'administrator' || role === 'admin') {
        window.location.hash = '#admin-dashboard'
      } else if (role === 'warden') {
        window.location.hash = '#warden-dashboard'
      } else {
        window.location.hash = '#dashboard'
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
      const res = await logInWithGoogle()
      const role = res?.user?.role || ''
      if (role === 'administrator' || role === 'admin') {
        window.location.hash = '#admin-dashboard'
      } else if (role === 'warden') {
        window.location.hash = '#warden-dashboard'
      } else {
        window.location.hash = '#dashboard'
      }
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

  if (isReset) {
    return <div className="auth-card auth-card--reset">
      <a className="auth-card-back" href="#login">&larr; Back to sign in</a>
      <div className="auth-card__top">
        <h1>Create new password</h1>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          {emailForReset ? `Resetting password for ${emailForReset}` : 'Enter your new password below.'}
        </p>
      </div>

      {verifyingCode ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loader-spinner" style={{ 
            width: '28px', 
            height: '28px', 
            border: '2px solid rgba(16, 185, 129, 0.15)', 
            borderTopColor: '#10b981', 
            borderRadius: '50%', 
            animation: 'spin-loader 0.8s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Verifying reset link...</p>
          <style>{`
            @keyframes spin-loader {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
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
          {successMessage && (
            <div className="auth-success-message" style={{ 
              color: '#16a34a', 
              backgroundColor: '#dcfce7', 
              border: '1px solid #bbf7d0', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              marginBottom: '16px', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              textAlign: 'center'
            }}>
              {successMessage}
            </div>
          )}

          {(!oobCode || error.includes('invalid or has expired')) ? (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a className="auth-submit" href="#forgot-password" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '12px', boxSizing: 'border-box', backgroundColor: 'var(--primary-color, #10b981)', color: '#fff', borderRadius: '8px', fontWeight: '600' }}>
                Request new reset link
              </a>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleResetSubmit}>
              <div className="auth-password-container">
                <label className="auth-password-label">
                  <span>NEW PASSWORD</span>
                </label>
                <div className="auth-password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)" 
                    autoComplete="new-password"
                    required 
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="auth-password-container" style={{ marginTop: '1.25rem' }}>
                <label className="auth-password-label">
                  <span>CONFIRM NEW PASSWORD</span>
                </label>
                <div className="auth-password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password" 
                    autoComplete="new-password"
                    required 
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                <input 
                  type="checkbox" 
                  id="show-reset-password" 
                  checked={showPassword} 
                  onChange={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="show-reset-password" style={{ cursor: 'pointer', margin: 0, fontWeight: 'normal' }}>Show Passwords</label>
              </div>

              <button className="auth-submit" type="submit" style={{ marginTop: '1.5rem' }} disabled={loading}>
                {loading ? 'Updating password...' : 'Update Password'}
              </button>
            </form>
          )}
        </>
      )}
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