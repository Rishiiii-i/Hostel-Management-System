import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './OtpVerification.css';

export default function OtpVerification({ email: propEmail, onSuccess }) {
  const { verifyOtp, sendOtp, resendOtp, pendingOtpEmail } = useAuth();
  const targetEmail = propEmail || pendingOtpEmail || localStorage.getItem('pending_otp_email') || '';

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  // 60-second resend countdown timer
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only accept numeric digits
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    
    // Handle single digit input
    if (value.length <= 1) {
      newDigits[index] = value;
      setOtpDigits(newDigits);
      setError('');

      // Auto-advance focus to next input
      if (value && index < 5 && inputRefs[index + 1].current) {
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs[index - 1].current) {
        // Move focus backward on backspace if current field is empty
        inputRefs[index - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numericData = pasteData.replace(/\D/g, '').slice(0, 6);

    if (numericData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = numericData[i] || '';
      }
      setOtpDigits(newDigits);
      setError('');

      // Focus the input box after the last pasted digit
      const targetIndex = Math.min(numericData.length, 5);
      if (inputRefs[targetIndex].current) {
        inputRefs[targetIndex].current.focus();
      }
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!targetEmail) {
      setError('No email found for verification. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(targetEmail, fullOtp);
      setSuccess('Verification successful! Accessing Student Dashboard...');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result);
        } else {
          window.location.hash = '#dashboard';
        }
      }, 1000);
    } catch (err) {
      console.error('OTP Verification failed:', err);
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      await resendOtp(targetEmail);
      setSuccess('A new 6-digit OTP code has been sent to your email address.');
      setCountdown(60); // Restart 60s countdown timer
      setOtpDigits(['', '', '', '', '', '']); // Clear input boxes
      if (inputRefs[0].current) inputRefs[0].current.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP. Please wait before trying again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <a className="otp-card-back" href="#login">&larr; Back to login</a>
        
        <div className="otp-header">
          <div className="otp-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1>Two-Step Authentication</h1>
          <p>
            We have sent a 6-digit verification code to<br />
            <strong className="otp-email-highlight">{targetEmail || 'your email address'}</strong>
          </p>
        </div>

        {error && (
          <div className="otp-alert otp-alert--error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="otp-alert otp-alert--success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-inputs-wrapper" onPaste={handlePaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`otp-digit-input ${digit ? 'is-filled' : ''}`}
                disabled={loading}
                autoComplete="off"
              />
            ))}
          </div>

          <button
            type="submit"
            className="otp-verify-btn"
            disabled={loading || otpDigits.join('').length !== 6}
          >
            {loading ? (
              <span className="otp-loading-span">
                <span className="otp-spinner"></span> Verifying OTP...
              </span>
            ) : (
              'Verify & Continue to Dashboard'
            )}
          </button>
        </form>

        <div className="otp-footer">
          <p className="otp-resend-text">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className={`otp-resend-btn ${countdown > 0 ? 'is-disabled' : ''}`}
            >
              {resendLoading ? (
                'Resending...'
              ) : countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
