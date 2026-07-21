import { useEffect, useState, lazy, Suspense } from 'react'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

// Lazy load heavy page components for instant initial load speed
const Login = lazy(() => import('./pages/Login'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const WardenDashboard = lazy(() => import('./pages/warden/WardenDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function LoadingSpinner() {
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
      <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Loading...</span>
      <style>{`
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#home')
  const [activeTab, setActiveTab] = useState('overview')
  const { user, loading } = useAuth()
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    room: '',
    block: '',
    rollNo: ''
  })

  // Synchronize local editable profile state when authenticated user changes
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
      const searchParams = new URLSearchParams(window.location.search)
      const isResetAction = searchParams.get('mode') === 'resetPassword' && searchParams.get('oobCode')

      const isDashboardRoute = hash === '#dashboard' || hash === '#student-dashboard' || hash === '#warden-dashboard' || hash === '#admin-dashboard' || hash.startsWith('#dashboard')
      const isAuthRoute = hash === '#login' || hash === '#signup' || hash === '#forgot-password' || hash === '#reset-password' || isResetAction

      if (isDashboardRoute && !user && !loading) {
        window.location.hash = '#login'
      } else if (isAuthRoute && user) {
        window.location.hash = (user.role === 'administrator' || user.role === 'admin') ? '#admin-dashboard' : user.role === 'warden' ? '#warden-dashboard' : '#dashboard'
      } else {
        setRoute(hash)
      }
    }

    const hash = window.location.hash || '#home'
    const searchParams = new URLSearchParams(window.location.search)
    const isResetAction = searchParams.get('mode') === 'resetPassword' && searchParams.get('oobCode')

    const isDashboardRoute = hash === '#dashboard' || hash === '#student-dashboard' || hash === '#warden-dashboard' || hash === '#admin-dashboard' || hash.startsWith('#dashboard')
    const isAuthRoute = hash === '#login' || hash === '#signup' || hash === '#forgot-password' || hash === '#reset-password' || isResetAction

    if (isDashboardRoute && !user && !loading) {
      window.location.hash = '#login'
    } else if (isAuthRoute && user) {
      window.location.hash = (user.role === 'administrator' || user.role === 'admin') ? '#admin-dashboard' : user.role === 'warden' ? '#warden-dashboard' : '#dashboard'
    } else {
      setRoute(hash)
    }

    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [user, loading])

  if (loading) {
    return <LoadingSpinner />
  }

  const searchParams = new URLSearchParams(window.location.search)
  const isResetAction = searchParams.get('mode') === 'resetPassword' && searchParams.get('oobCode')

  if (route === '#login' || route === '#signup' || route === '#forgot-password' || route === '#reset-password' || isResetAction) {
    let mode = 'login'
    if (route === '#signup') mode = 'signup'
    else if (route === '#forgot-password') mode = 'forgot'
    else if (route === '#reset-password' || isResetAction) mode = 'reset'

    const oobCode = searchParams.get('oobCode') || ''
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthLayout><Login mode={mode} oobCode={oobCode} /></AuthLayout>
      </Suspense>
    )
  }

  if (route === '#admin-dashboard' || ((user?.role === 'administrator' || user?.role === 'admin') && (route === '#dashboard' || route.startsWith('#dashboard')))) {
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile}>
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
          </MainLayout>
        </Suspense>
      </ProtectedRoute>
    )
  }

  if (route === '#warden-dashboard' || (user?.role === 'warden' && (route === '#dashboard' || route.startsWith('#dashboard')))) {
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile}>
            <WardenDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          </MainLayout>
        </Suspense>
      </ProtectedRoute>
    )
  }

  if (route === '#dashboard' || route === '#student-dashboard' || route.startsWith('#dashboard')) {
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile}>
            <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
          </MainLayout>
        </Suspense>
      </ProtectedRoute>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LandingPage />
    </Suspense>
  )
}

export default App