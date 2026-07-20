// updated frontend
import { useEffect, useState } from 'react'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import StudentDashboard from './pages/StudentDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#home')
  const [activeTab, setActiveTab] = useState('overview')
  const { user, loading } = useAuth()
  
  const [profile, setProfile] = useState({
    fullName: 'Rahul Sharma',
    email: 'student@smarthostel.com',
    phone: '+91 98765 43210',
    emergencyContact: '+91 98765 00000',
    room: 'Room 204',
    block: 'Block A',
    rollNo: '2024CS108'
  })

  // synchronize local editable profile state when authenticated user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email
      }))
    }
  }, [user])

  useEffect(() => {
    const updateRoute = () => {
      const hash = window.location.hash || '#home'
      const isDashboardRoute = hash === '#dashboard' || hash === '#student-dashboard' || hash.startsWith('#dashboard')
      const isAuthRoute = hash === '#login' || hash === '#signup' || hash === '#forgot-password'

      console.log('[Routing Debug] Hash changed:', { hash, user, loading });

      if (isDashboardRoute && !user && !loading) {
        console.log('[Routing Debug] Dashboard block: No user, not loading. Redirecting to #login');
        window.location.hash = '#login'
      } else if (isAuthRoute && user) {
        console.log('[Routing Debug] Auth screen bypass: User is logged in. Redirecting to #dashboard');
        window.location.hash = '#dashboard'
      } else {
        console.log('[Routing Debug] No guard match. Setting route state to:', hash);
        setRoute(hash)
      }
    }

    // run guard check on state/route change
    const hash = window.location.hash || '#home'
    const isDashboardRoute = hash === '#dashboard' || hash === '#student-dashboard' || hash.startsWith('#dashboard')
    const isAuthRoute = hash === '#login' || hash === '#signup' || hash === '#forgot-password'

    console.log('[Routing Debug] Guard effect triggered:', { hash, user, loading });

    if (isDashboardRoute && !user && !loading) {
      console.log('[Routing Debug] Direct load block: No user, not loading. Redirecting to #login');
      window.location.hash = '#login'
    } else if (isAuthRoute && user) {
      console.log('[Routing Debug] Direct load bypass: User is logged in. Redirecting to #dashboard');
      window.location.hash = '#dashboard'
    } else {
      console.log('[Routing Debug] Direct load fallback. Setting route state to:', hash);
      setRoute(hash)
    }

    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [user, loading])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loader-spinner" style={{ 
          width: '36px', 
          height: '36px', 
          border: '3px solid rgba(16, 185, 129, 0.15)', 
          borderTopColor: '#10b981', 
          borderRadius: '50%', 
          animation: 'spin-loader 0.8s linear infinite' 
        }}></div>
        <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Initializing Smart Hostel...</span>
        <style>{`
          @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (route === '#login' || route === '#signup' || route === '#forgot-password') {
    const mode = route === '#signup' ? 'signup' : route === '#forgot-password' ? 'forgot' : 'login'
    return <AuthLayout><Login mode={mode} /></AuthLayout>
  }

  if (route === '#dashboard' || route === '#student-dashboard' || route.startsWith('#dashboard')) {
    return (
      <ProtectedRoute>
        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile}>
          <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return <LandingPage />
}

export default App