import './ThemeToggle.css'
import { useState, useEffect } from 'react'
import sunIcon from '../assets/icons/sun.png'
import moonIcon from '../assets/icons/moon.png'

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
            <img src={moonIcon} alt="Dark Mode" width="13" height="13" />
          ) : (
            <img src={sunIcon} alt="Light Mode" width="13" height="13" />
          )}
        </span>
      </span>
    </button>
  )
}
