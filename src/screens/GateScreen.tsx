import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { config, findChapterEntry } from '../config'
import { Hud } from '../components/Hud'
import { Markdown } from '../components/Markdown'
import { useProgress } from '../state/ProgressContext'
import { sfx } from '../lib/sound'
import { track } from '../lib/analytics'

/** 잠긴 챕터 본문에서 무료 미리보기 조각을 뽑는다 (도입부 + 첫 섹션까지, 최대 700자) */
function previewOf(body: string): string {
  const sections = body.split(/^## /m)
  // 도입(제목+훅) + 첫 번째 "## " 섹션까지
  const cut = sections.length > 2 ? sections[0] + '## ' + sections[1] : body
  return cut.length > 700 ? cut.slice(0, 700) + '…' : cut
}

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

  const pendingEntry = pendingChapterId ? findChapterEntry(pendingChapterId) : null
  const preview = useMemo(
    () => (pendingEntry ? previewOf(pendingEntry.chapter.body) : null),
    [pendingEntry],
  )

  useEffect(() => {
    track('gate_view', pendingChapterId ? { chapter: pendingChapterId } : undefined)
  }, [pendingChapterId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (tryUnlockMembership(code)) {
      sfx.achievement()
      track('gate_unlocked')
      onUnlocked(pendingChapterId)
    } else {
      sfx.error()
      track('gate_denied')
      setError(true)
    }
  }

  return (
    <div className="screen gate-screen">
      <Hud />

      {/* 무료 미리보기 — 가치를 먼저 보여주고 막는다 */}
      {preview && pendingEntry && (
        <div className="gate-preview" aria-label="무료 미리보기">
          <article className="chapter-body gate-preview-body">
            <Markdown source={preview} />
          </article>
          <div className="gate-preview-fade" aria-hidden="true" />
          <p className="gate-preview-note">── 여기까지 무료 미리보기 ──</p>
        </div>
      )}

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
            onClick={() => {
              sfx.confirm()
              track('channel_click')
            }}
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
