import { useEffect, useState } from 'react'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import StudentDashboard from './pages/StudentDashboard'

function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#home')
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState({
    fullName: 'Rishi Dileep',
    email: 'rishidileep@gmail.com',
    phone: '+91 98765 43210',
    emergencyContact: '+91 98765 00000',
    room: 'Room 204',
    block: 'Block A',
    rollNo: '2024CS108'
  })

  useEffect(() => {
    const updateRoute = () => {
      const hash = window.location.hash || '#home'
      setRoute(hash)
    }
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  if (route === '#login' || route === '#signup' || route === '#forgot-password') {
    const mode = route === '#signup' ? 'signup' : route === '#forgot-password' ? 'forgot' : 'login'
    return <AuthLayout><Login mode={mode} /></AuthLayout>
  }

  if (route === '#dashboard' || route === '#student-dashboard' || route.startsWith('#dashboard')) {
    return (
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile}>
        <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
      </MainLayout>
    )
  }

  return <LandingPage />
}

export default App