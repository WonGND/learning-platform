import { useEffect, useState } from 'react'
import { confirmPayment } from '../lib/payment'
import { useEntitlement } from '../state/EntitlementContext'
import { track } from '../lib/analytics'
import { sfx } from '../lib/sound'

interface Props {
  outcome: 'success' | 'fail'
  query: string
  onDone: () => void
}

/**
 * 토스 결제 리다이렉트 처리 화면.
 * 성공 리다이렉트라도 서버 confirm 이 완료돼야 "결제됨"으로 간주한다
 * (클라이언트의 성공 신호를 신뢰하지 않는다).
 */
export function PaymentResultScreen({ outcome, query, onDone }: Props) {
  const { refreshEntitlements } = useEntitlement()
  const [state, setState] = useState<'confirming' | 'ok' | 'fail'>(
    outcome === 'success' ? 'confirming' : 'fail',
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (outcome !== 'success') {
      setMessage('결제가 취소되었거나 실패했습니다.')
      return
    }
    const params = new URLSearchParams(query)
    const paymentKey = params.get('paymentKey') ?? ''
    const orderId = params.get('orderId') ?? ''
    const amount = Number(params.get('amount') ?? 0)
    if (!paymentKey || !orderId || !amount) {
      setState('fail')
      setMessage('결제 정보가 올바르지 않습니다.')
      return
    }
    let active = true
    confirmPayment({ paymentKey, orderId, amount }).then(async ({ error }) => {
      if (!active) return
      if (error) {
        setState('fail')
        setMessage(error)
        sfx.error()
      } else {
        await refreshEntitlements()
        setState('ok')
        track('payment_confirmed')
        sfx.achievement()
      }
    })
    return () => {
      active = false
    }
  }, [outcome, query, refreshEntitlements])

  return (
    <div className="screen gate-screen">
      <div className="gate-card">
        {state === 'confirming' && <p className="gate-desc blink">결제 확인 중… ▓▓▒▒</p>}
        {state === 'ok' && (
          <>
            <p className="gate-title" style={{ color: 'var(--accent)' }}>
              ✓ 결제 완료 — 마스터의 탑 개방!
            </p>
            <p className="gate-desc">이제 모든 유료 챕터를 열람할 수 있습니다.</p>
          </>
        )}
        {state === 'fail' && (
          <>
            <p className="gate-title">✕ 결제 미완료</p>
            <p className="gate-error">{message}</p>
          </>
        )}
        <button
          type="button"
          className="pixel-btn ghost-btn"
          onClick={() => {
            sfx.blip()
            onDone()
          }}
        >
          ■ MAP
        </button>
      </div>
    </div>
  )
}
