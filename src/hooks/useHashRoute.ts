import { useCallback, useEffect, useState } from 'react'

/**
 * 해시 기반 라우터 — 정적 호스팅(리라이트 설정 불필요)에서 딥링크·새로고침 복원·
 * 뒤로가기를 지원한다. react-router 대신 경량 구현으로 번들과 장면 전환 감성을 유지.
 *
 * 라우트: #/ (타이틀) · #/map · #/chapter/:id · #/quiz · #/trophies · #/gate/:pendingId
 */
export type Route =
  | { screen: 'title' }
  | { screen: 'map' }
  | { screen: 'quiz' }
  | { screen: 'achievements' }
  | { screen: 'chapter'; chapterId: string }
  | { screen: 'gate'; pendingChapterId: string | null }
  | { screen: 'pay'; outcome: 'success' | 'fail'; query: string }

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  // 결제 리다이렉트: 토스가 successUrl 에 ?paymentKey=... 쿼리를 붙인다
  const queryIdx = raw.indexOf('?')
  const query = queryIdx >= 0 ? raw.slice(queryIdx + 1) : ''
  const path = queryIdx >= 0 ? raw.slice(0, queryIdx) : raw
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'pay') {
    return { screen: 'pay', outcome: parts[1] === 'success' ? 'success' : 'fail', query }
  }
  switch (parts[0]) {
    case undefined:
      return { screen: 'title' }
    case 'map':
      return { screen: 'map' }
    case 'quiz':
      return { screen: 'quiz' }
    case 'trophies':
      return { screen: 'achievements' }
    case 'chapter':
      return parts[1]
        ? { screen: 'chapter', chapterId: decodeURIComponent(parts[1]) }
        : { screen: 'map' }
    case 'gate':
      return { screen: 'gate', pendingChapterId: parts[1] ? decodeURIComponent(parts[1]) : null }
    case 'pay':
      return { screen: 'pay', outcome: 'fail', query: '' }
    default:
      // 알 수 없는 해시는 타이틀로 안전 폴백
      return { screen: 'title' }
  }
}

export function routeToHash(route: Route): string {
  switch (route.screen) {
    case 'title':
      return '#/'
    case 'map':
      return '#/map'
    case 'quiz':
      return '#/quiz'
    case 'achievements':
      return '#/trophies'
    case 'chapter':
      return `#/chapter/${encodeURIComponent(route.chapterId)}`
    case 'gate':
      return route.pendingChapterId
        ? `#/gate/${encodeURIComponent(route.pendingChapterId)}`
        : '#/gate'
    case 'pay':
      return `#/pay/${route.outcome}`
  }
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next)
    if (window.location.hash === hash) {
      // 동일 해시로의 이동(hashchange 미발생)도 상태를 갱신
      setRoute(next)
    } else {
      window.location.hash = hash
    }
  }, [])

  return [route, navigate]
}
