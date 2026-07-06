import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** OS의 "동작 줄이기" 설정을 존중한다 — true면 타이핑/스캔라인 등 연출을 생략 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () => typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
