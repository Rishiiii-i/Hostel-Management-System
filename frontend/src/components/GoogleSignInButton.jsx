import googleIcon from '../assets/icons/google.png'

export default function GoogleSignInButton({ text = 'Sign in with Google', onClick, type = 'button' }) {
  return (
    <button 
      type={type} 
      className="auth-google-btn" 
      onClick={onClick}
    >
      <img src={googleIcon} alt="Google" width="20" height="20" className="auth-google-icon" />
      <span>{text}</span>
    </button>
  )
}
