import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * AnimatedCounter — smoothly counts from 0 to `to` value over `duration` ms.
 * Optionally respects IntersectionObserver to trigger only when visible.
 */
export function AnimatedCounter({ to, duration = 1500, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const startedRef = useRef(false)

  const runAnimation = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    let start = 0
    const totalSteps = duration / 16
    const step = to / totalSteps
    const timer = setInterval(() => {
      start += step
      if (start >= to) {
        setVal(to)
        clearInterval(timer)
      } else {
        setVal(Math.floor(start))
      }
    }, 16)
  }, [to, duration])

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to, duration, runAnimation])

  return (
    <span ref={ref}>
      {val}{suffix}
    </span>
  )
}

export default AnimatedCounter
