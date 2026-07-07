import { load, save } from './storage'

/**
 * 프라이버시 존중 분석 — 동의 기반·최소 수집·PII 없음.
 *
 * - 사용자가 명시적으로 동의(granted)하기 전에는 어떤 이벤트도 기록하지 않는다.
 * - 이벤트는 외부로 전송되지 않고 window.__qqEvents 큐에만 쌓인다 (메모리, 새로고침 시 소멸).
 *   GA4/Plausible 등을 붙이려면 track() 하단의 어댑터 지점에서 큐를 소비하면 된다.
 *   이때 CSP의 connect-src에 해당 도메인 추가와 README의 개인정보 고지 요건 이행이 필요하다.
 * - 수집 대상은 퍼널 단계 이벤트뿐이다 (챕터 완료, 퀴즈 완료, 게이트 조회/해제, CTA 클릭).
 */
export type Consent = 'granted' | 'denied' | null

export interface AnalyticsEvent {
  event: string
  props?: Record<string, string | number>
  at: number
}

declare global {
  interface Window {
    __qqEvents?: AnalyticsEvent[]
  }
}

export function getConsent(): Consent {
  const raw = load<unknown>('consent', null)
  return raw === 'granted' || raw === 'denied' ? raw : null
}

export function setConsent(consent: Exclude<Consent, null>): void {
  save('consent', consent)
}

export function track(event: string, props?: Record<string, string | number>): void {
  if (getConsent() !== 'granted') return
  const entry: AnalyticsEvent = { event, props, at: Date.now() }
  window.__qqEvents = window.__qqEvents ?? []
  window.__qqEvents.push(entry)
  // ── 어댑터 지점: 외부 분석 도구 연동 시 여기서 전송 (동의 상태에서만 호출됨) ──
  if (import.meta.env.DEV) console.debug('[analytics]', entry)
}
