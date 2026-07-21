import './ThemeToggle.css'
import { useState, useEffect } from 'react'
import Icon from './Icon'

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <button 
      type="button" 
      className={`theme-toggle-switch ${darkMode ? 'dark' : 'light'}`} 
      onClick={toggleDarkMode}
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <span className="toggle-track">
        <span className="toggle-thumb">
          {darkMode ? (
            <Icon name="moon" width="13" height="13" />
          ) : (
            <Icon name="sun" width="13" height="13" />
          )}
        </span>
      </span>
    </button>
  )
}
