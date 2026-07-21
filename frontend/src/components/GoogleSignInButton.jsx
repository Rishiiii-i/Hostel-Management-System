import './GoogleSignInButton.css'
import Icon from './Icon'

export default function GoogleSignInButton({ text = 'Sign in with Google', onClick, type = 'button' }) {
  return (
    <button 
      type={type} 
      className="auth-google-btn" 
      onClick={onClick}
    >
      <Icon name="google" width="20" height="20" className="auth-google-icon" />
      <span>{text}</span>
    </button>
  )
}
