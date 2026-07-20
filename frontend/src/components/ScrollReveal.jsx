import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 700, 
  animation = 'fade-up' 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px' // trigger slightly before the element fully enters
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  // map simple animation names to tailwind class names
  const getAnimationClasses = () => {
    switch (animation) {
      case 'fade-up':
        return isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-10 scale-[0.98]'
      case 'fade-in':
        return isVisible ? 'opacity-100' : 'opacity-0'
      case 'scale-up':
        return isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      case 'slide-left':
        return isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-10'
      case 'slide-right':
        return isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 -translate-x-10'
      default:
        return isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    }
  }

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${getAnimationClasses()} ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms` 
      }}
    >
      {children}
    </div>
  )
}
