import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { config, findChapterEntry } from '../config'
import { Hud } from '../components/Hud'
import { useEntitlement } from '../state/EntitlementContext'
import { supabase, tossClientKey } from '../lib/supabase'
import { startPayment } from '../lib/payment'
import { sfx } from '../lib/sound'
import { track } from '../lib/analytics'

interface Props {
  /** 해제 성공 시 이동할 챕터 */
  pendingChapterId: string | null
  onUnlocked: (chapterId: string | null) => void
  onBackToMap: () => void
}

const CODE_ERRORS: Record<string, string> = {
  invalid: '유효하지 않은 코드입니다.',
  expired: '만료된 코드입니다.',
  exhausted: '사용 한도가 모두 소진된 코드입니다.',
  already_redeemed: '이미 사용한 코드입니다.',
}

/**
 * 멤버십 게이트 (모델 B) — 티저 미리보기 → 로그인 → (입장 코드 | 토스 결제) → 해제.
 * 잠금해제 판정은 전적으로 서버(엔타이틀먼트/RLS)에서 이뤄진다.
 */
export function GateScreen({ pendingChapterId, onUnlocked, onBackToMap }: Props) {
  const { backendReady, session, hasPaidAccess, signInWithEmail, refreshEntitlements } =
    useEntitlement()
  const pendingEntry = pendingChapterId ? findChapterEntry(pendingChapterId) : null
  const teaser = pendingEntry?.chapter.teaser

  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    track('gate_view', pendingChapterId ? { chapter: pendingChapterId } : undefined)
  }, [pendingChapterId])

  // 권한이 생기면(로그인+엔타이틀먼트) 자동으로 원래 챕터로
  useEffect(() => {
    if (hasPaidAccess) onUnlocked(pendingChapterId)
  }, [hasPaidAccess, pendingChapterId, onUnlocked])

  const sendLink = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await signInWithEmail(email.trim())
    setBusy(false)
    if (error) {
      setError(error)
      sfx.error()
    } else {
      setLinkSent(true)
      sfx.confirm()
    }
  }

  const redeem = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const { data, error: fnErr } = await supabase.functions.invoke('redeem-code', {
      body: { code: code.trim() },
    })
    setBusy(false)
    if (fnErr || !data) {
      setError('코드 확인 중 오류가 발생했습니다.')
      sfx.error()
      return
    }
    if (data.ok) {
      sfx.achievement()
      track('gate_unlocked', { via: 'code' })
      await refreshEntitlements() // 성공 시 useEffect 가 챕터로 이동
    } else {
      setError(CODE_ERRORS[data.error] ?? '코드를 확인해주세요.')
      track('gate_denied')
      sfx.error()
    }
  }

  const pay = async () => {
    setBusy(true)
    setError('')
    track('cta_click', { via: 'payment' })
    const { error } = await startPayment()
    setBusy(false)
    if (error) {
      setError(error)
      sfx.error()
    }
    // 성공 시 토스 결제창으로 리다이렉트됨
  }

  return (
    <div className="screen gate-screen">
      <Hud />

      {teaser && (
        <div className="gate-preview" aria-label="미리보기">
          <p className="gate-preview-teaser">{teaser}</p>
          <p className="gate-preview-note">── 여기까지 미리보기 ──</p>
        </div>
      )}

      <div className="gate-card">
        <p className="gate-title">— MEMBERS ONLY AREA —</p>

        {!backendReady ? (
          <p className="gate-desc">
            결제 시스템이 아직 준비 중입니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : !session ? (
          // ── 1단계: 로그인 (이메일 매직링크) ──
          <>
            <p className="gate-desc">
              멤버 전용 구역입니다. 이메일로 로그인 후 입장 코드 또는 결제로 해제하세요.
            </p>
            {linkSent ? (
              <p className="gate-desc" style={{ color: 'var(--accent)' }}>
                ✉ 로그인 링크를 보냈습니다. 메일함을 확인하세요.
              </p>
            ) : (
              <form className="gate-form" onSubmit={sendLink}>
                <label className="gate-label" htmlFor="gate-email">
                  EMAIL
                </label>
                <div className="gate-input-row">
                  <input
                    id="gate-email"
                    className="gate-input"
                    type="email"
                    required
                    value={email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className="pixel-btn" disabled={busy || !email.trim()}>
                    로그인 링크 받기
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          // ── 2단계: 코드 입력 | 결제 ──
          <>
            <p className="gate-desc">{session.user.email} 로 로그인됨</p>

            <form className="gate-form" onSubmit={redeem}>
              <label className="gate-label" htmlFor="gate-code">
                ENTER CODE
              </label>
              <div className="gate-input-row">
                <input
                  id="gate-code"
                  className="gate-input"
                  type="text"
                  value={code}
                  placeholder="입장 코드"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError('')
                  }}
                />
                <button type="submit" className="pixel-btn" disabled={busy || code.trim() === ''}>
                  UNLOCK
                </button>
              </div>
            </form>

            {tossClientKey && (
              <>
                <p className="gate-or">— 또는 —</p>
                <button
                  type="button"
                  className="pixel-btn start-btn"
                  disabled={busy}
                  onClick={pay}
                >
                  ₩ 결제하고 전권 해제
                </button>
              </>
            )}

            {config.membership.channelUrl && (
              <a
                className="pixel-btn ghost-btn"
                href={config.membership.channelUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('channel_click')}
              >
                무료 채널에서 코드 받기 →
              </a>
            )}
          </>
        )}

        {error && (
          <p className="gate-error" role="alert">
            ✕ {error}
          </p>
        )}
      </div>

      <button
        type="button"
        className="pixel-btn ghost-btn"
        onClick={() => {
          sfx.blip()
          onBackToMap()
        }}
      >
        ■ MAP
      </button>
    </div>
  )
}
