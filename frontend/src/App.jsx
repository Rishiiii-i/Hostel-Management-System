import { useEffect, useState } from 'react'
import AuthLayout from './layouts/AuthLayout'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  if (route === '#login' || route === '#signup' || route === '#forgot-password') {
    const mode = route === '#signup' ? 'signup' : route === '#forgot-password' ? 'forgot' : 'login'
    return <AuthLayout><Login mode={mode} /></AuthLayout>
  }

  return <LandingPage />
}

export default App