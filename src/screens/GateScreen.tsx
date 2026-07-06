import { useState } from 'react'
import type { FormEvent } from 'react'
import { config } from '../config'
import { Hud } from '../components/Hud'
import { useProgress } from '../state/ProgressContext'
import { sfx } from '../lib/sound'

interface Props {
  /** 해제 성공 시 이동할 챕터 */
  pendingChapterId: string | null
  onUnlocked: (chapterId: string | null) => void
  onBackToMap: () => void
}

/**
 * 멤버십 게이트 — 잠긴 챕터 진입 시 표시. 채널 안내 + 입장 코드 입력.
 * 주의: 클라이언트 검증이므로 무료 멤버십 유도 용도로만 사용하라.
 * 유료 콘텐츠는 절대 이 코드로 보호하지 마라 (소스에 코드가 노출된다).
 */
export function GateScreen({ pendingChapterId, onUnlocked, onBackToMap }: Props) {
  const { tryUnlockMembership } = useProgress()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (tryUnlockMembership(code)) {
      sfx.achievement()
      onUnlocked(pendingChapterId)
    } else {
      sfx.error()
      setError(true)
    }
  }

  return (
    <div className="screen gate-screen">
      <Hud />

      <div className="gate-card">
        <pre className="gate-art" aria-hidden="true">{String.raw`
   ┌─────────────┐
   │  ▒▒▒▒▒▒▒▒▒  │
   │  ▒ LOCKED ▒ │
   │  ▒▒▒▒▒▒▒▒▒  │
   └──────┬──────┘
          🔒`}</pre>

        <h2 className="gate-title">— MEMBERS ONLY AREA —</h2>
        <p className="gate-desc">
          여기서부터는 멤버 전용 구역이다.
          <br />
          무료 멤버십 채널에서 입장 코드를 받아라.
        </p>

        {config.membership.channelUrl && (
          <a
            className="pixel-btn class-check-btn"
            href={config.membership.channelUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx.confirm()}
          >
            ▶ 무료 멤버십 채널 바로가기
          </a>
        )}

        <form className="gate-form" onSubmit={submit}>
          <label className="gate-label" htmlFor="gate-code">
            ENTER CODE
          </label>
          <div className="gate-input-row">
            <input
              id="gate-code"
              className="gate-input"
              type="text"
              value={code}
              placeholder="XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setCode(e.target.value)
                setError(false)
              }}
            />
            <button type="submit" className="pixel-btn" disabled={code.trim() === ''}>
              UNLOCK
            </button>
          </div>
          {error && (
            <p className="gate-error" role="alert">
              ✕ ACCESS DENIED — 코드가 올바르지 않다. 다시 시도하라.
            </p>
          )}
        </form>
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
