// useScrollReveal.js  — drop in src/hooks/
// Usage: call useScrollReveal() once inside LandingPage

import { useEffect } from 'react'

export default function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.reveal, .reveal-stagger, .section-header, .stats-section'
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
