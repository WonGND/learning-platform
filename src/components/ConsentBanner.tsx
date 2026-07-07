import { useState } from 'react'
import { getConsent, setConsent } from '../lib/analytics'
import { sfx } from '../lib/sound'

/**
 * 분석 동의 배너 — 최초 1회, 동의/거절 선택 전까지 어떤 이벤트도 수집하지 않는다.
 * 개인정보(PII)는 어떤 선택에서도 수집하지 않는다.
 */
export function ConsentBanner() {
  const [consent, setState] = useState(getConsent())

  if (consent !== null) return null

  const choose = (value: 'granted' | 'denied') => {
    setConsent(value)
    setState(value)
    sfx.blip()
  }

  return (
    <div className="consent-banner" role="dialog" aria-label="사용 통계 동의">
      <p className="consent-text">
        학습 경험 개선을 위한 <strong>익명 사용 통계</strong>(퍼널 단계 이벤트) 수집에
        동의하십니까? 개인정보는 수집하지 않으며, 거절해도 모든 기능을 쓸 수 있습니다.
      </p>
      <div className="consent-actions">
        <button type="button" className="pixel-btn consent-btn" onClick={() => choose('granted')}>
          동의
        </button>
        <button
          type="button"
          className="pixel-btn ghost-btn consent-btn"
          onClick={() => choose('denied')}
        >
          거절
        </button>
      </div>
    </div>
  )
}
