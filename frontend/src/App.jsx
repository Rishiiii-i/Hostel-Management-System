import { useEffect, useState, lazy, Suspense } from 'react'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

// Load pages only when they are needed
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
  
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('shm_user_profile')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {
      fullName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      room: '',
      block: '',
      rollNo: '',
      photo: ''
    }
  })

  // Update local profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => {
        const isGeneric = (n) => !n || ['student', 'warden', 'admin', 'user', 'system administrator'].includes(n.toLowerCase().trim());
        const isDifferentUser = prev.email && user.email && prev.email.toLowerCase() !== user.email.toLowerCase()
        const shouldUpdateName = 
          isDifferentUser || 
          isGeneric(prev.fullName) || 
          (user.name && !isGeneric(user.name) && user.name !== prev.fullName);

        const updated = {
          ...prev,
          fullName: shouldUpdateName ? (user.name || '') : prev.fullName,
          email: user.email || prev.email || '',
          photo: user.photo !== undefined ? user.photo : (isDifferentUser ? (user.photoURL || '') : (prev.photo || user.photoURL || '')),
          // Sync database-backed fields from user if available
          phone: user.phone !== undefined ? user.phone : (isDifferentUser ? '' : prev.phone),
          emergencyContact: user.emergencyContact !== undefined ? user.emergencyContact : (isDifferentUser ? '' : prev.emergencyContact),
          room: user.room !== undefined ? user.room : (isDifferentUser ? '' : prev.room),
          block: user.block !== undefined ? user.block : (isDifferentUser ? '' : prev.block),
          rollNo: user.rollNo !== undefined ? user.rollNo : (isDifferentUser ? '' : prev.rollNo)
        }
        try {
          localStorage.setItem('shm_user_profile', JSON.stringify(updated))
        } catch (e) {}
        return updated
      })
    } else {
      // Clear profile state when user logs out
      setProfile({
        fullName: '',
        email: '',
        phone: '',
        emergencyContact: '',
        room: '',
        block: '',
        rollNo: '',
        photo: ''
      });
    }
  }, [user])

  // Sync profile state changes to localStorage (persisting notifications list, feeStatus, dues across refresh)
  useEffect(() => {
    if (profile && profile.email) {
      try {
        localStorage.setItem('shm_user_profile', JSON.stringify(profile));
      } catch (e) {}
    }
  }, [profile]);

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
      } else if (user) {
        const isAdminUser = user.role === 'administrator' || user.role === 'admin';
        const isWardenUser = user.role === 'warden';
        if (isAdminUser && hash !== '#admin-dashboard' && isDashboardRoute) {
          window.location.hash = '#admin-dashboard';
        } else if (isWardenUser && hash !== '#warden-dashboard' && isDashboardRoute) {
          window.location.hash = '#warden-dashboard';
        } else if (!isAdminUser && !isWardenUser && hash !== '#dashboard' && hash !== '#student-dashboard' && isDashboardRoute) {
          window.location.hash = '#dashboard';
        } else {
          setRoute(hash);
        }
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
    } else if (user) {
      const isAdminUser = user.role === 'administrator' || user.role === 'admin';
      const isWardenUser = user.role === 'warden';
      if (isAdminUser && hash !== '#admin-dashboard' && isDashboardRoute) {
        window.location.hash = '#admin-dashboard';
      } else if (isWardenUser && hash !== '#warden-dashboard' && isDashboardRoute) {
        window.location.hash = '#warden-dashboard';
      } else if (!isAdminUser && !isWardenUser && hash !== '#dashboard' && hash !== '#student-dashboard' && isDashboardRoute) {
        window.location.hash = '#dashboard';
      } else {
        setRoute(hash);
      }
    } else {
      setRoute(hash)
    }

    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [user, loading])

  useEffect(() => {
    setActiveTab('overview')
  }, [route, user?.email])

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
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile}>
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
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile}>
            <WardenDashboard activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
          </MainLayout>
        </Suspense>
      </ProtectedRoute>
    )
  }

  if (route === '#dashboard' || route === '#student-dashboard' || route.startsWith('#dashboard')) {
    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile}>
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