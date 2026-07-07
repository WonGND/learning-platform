import { useEffect, useMemo, useRef, useState } from 'react'
import { config, globalChapterIndex } from '../config'
import { Hud } from '../components/Hud'
import { Markdown } from '../components/Markdown'
import { FunnelSection } from '../components/FunnelSection'
import { CheckQuiz } from '../components/CheckQuiz'
import { useProgress } from '../state/ProgressContext'
import {
  useReadingSettings,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
  FONT_SCALE_STEP,
} from '../hooks/useReadingSettings'
import { sfx } from '../lib/sound'
import type { CSSProperties } from 'react'

interface Props {
  chapterId: string
  onOpenChapter: (chapterId: string) => void
  onBackToMap: () => void
}

/** 전체 챕터를 평탄화한 순서에서 이전/현재/다음 챕터를 찾는다 */
function locate(chapterId: string) {
  const flat = config.modes.flatMap((mode) => mode.chapters.map((chapter) => ({ mode, chapter })))
  const index = flat.findIndex((e) => e.chapter.id === chapterId)
  return {
    current: index >= 0 ? flat[index] : null,
    prev: index > 0 ? flat[index - 1] : null,
    next: flat[index + 1] ?? null,
  }
}

/** 한국어 기준 대략적 읽기 시간(분) — 분당 약 600자 가정 */
function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.length / 600))
}

/** 챕터 뷰어 — 마크다운 본문 + 읽기 옵션 + 진행바 + 목차 + 지식 확인 */
export function ChapterScreen({ chapterId, onOpenChapter, onBackToMap }: Props) {
  const { isCompleted, completeChapter, uncompleteChapter } = useProgress()
  const [reading, updateReading] = useReadingSettings()
  const { current, prev, next } = locate(chapterId)
  const articleRef = useRef<HTMLElement | null>(null)
  const [scrollPct, setScrollPct] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

  // 잘못된 챕터 id 방어: 월드맵으로 복귀
  useEffect(() => {
    if (!current) onBackToMap()
  }, [current, onBackToMap])

  useEffect(() => {
    window.scrollTo(0, 0)
    setTocOpen(false)
  }, [chapterId])

  // 본문 스크롤 진행바
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      if (total <= 0) {
        setScrollPct(100)
        return
      }
      const passed = Math.min(Math.max(-rect.top, 0), total)
      setScrollPct(Math.round((passed / total) * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [chapterId])

  // 읽기 모드에서는 CRT 스캔라인/비네트 오버레이를 끈다 (가독성 > 감성)
  useEffect(() => {
    if (reading.readMode) document.body.classList.add('no-fx')
    else document.body.classList.remove('no-fx')
    return () => document.body.classList.remove('no-fx')
  }, [reading.readMode])

  // 목차: 본문의 "## " 제목들 (Markdown 컴포넌트가 같은 순서로 sec-N id를 부여)
  const sections = useMemo(
    () =>
      (current?.chapter.body.match(/^## .+$/gm) ?? []).map((line) =>
        line.replace(/^## /, '').replace(/\*\*/g, ''),
      ),
    [current],
  )

  if (!current) return null

  const read = isCompleted(chapterId)
  const minutes = readingMinutes(current.chapter.body)
  // 무료 콘텐츠 완주 지점(게이트 직전 챕터) 또는 전체 마지막 챕터 완료 시 퍼널 노출
  const gate = config.membership.gateAfterChapter
  const isLastFree = Number.isFinite(gate) && globalChapterIndex(chapterId) === gate
  const isVeryLast = !next
  const showFunnel = read && (isLastFree || isVeryLast)

  const screenClass = `screen chapter-screen${reading.readMode ? ' read-mode' : ''}${
    reading.highContrast ? ' high-contrast' : ''
  }`
  const bodyStyle = { '--reading-scale': reading.fontScale } as CSSProperties

  return (
    <div className={screenClass}>
      <div className="read-progress" aria-hidden="true">
        <div className="read-progress-fill" style={{ width: `${scrollPct}%` }} />
      </div>

      <Hud />

      <nav className="chapter-breadcrumb" aria-label="현재 위치">
        <button type="button" className="crumb-link" onClick={onBackToMap}>
          WORLD MAP
        </button>
        <span aria-hidden="true"> ▸ </span>
        <span>{current.mode.name}</span>
        <span aria-hidden="true"> ▸ </span>
        <span className="crumb-current">{current.chapter.title}</span>
      </nav>

      <div className="chapter-toolbar" role="toolbar" aria-label="읽기 옵션">
        <span className="read-minutes">약 {minutes}분</span>

        {sections.length > 1 && (
          <button
            type="button"
            className="toolbar-btn"
            aria-expanded={tocOpen}
            onClick={() => {
              sfx.blip()
              setTocOpen((v) => !v)
            }}
          >
            ≡ 목차
          </button>
        )}

        <span className="toolbar-group" aria-label="글자 크기">
          <button
            type="button"
            className="toolbar-btn"
            aria-label="글자 작게"
            disabled={reading.fontScale <= FONT_SCALE_MIN}
            onClick={() => updateReading({ fontScale: reading.fontScale - FONT_SCALE_STEP })}
          >
            A−
          </button>
          <button
            type="button"
            className="toolbar-btn"
            aria-label="글자 크게"
            disabled={reading.fontScale >= FONT_SCALE_MAX}
            onClick={() => updateReading({ fontScale: reading.fontScale + FONT_SCALE_STEP })}
          >
            A+
          </button>
        </span>

        <button
          type="button"
          className={`toolbar-btn${reading.readMode ? ' on' : ''}`}
          aria-pressed={reading.readMode}
          onClick={() => {
            sfx.blip()
            updateReading({ readMode: !reading.readMode })
          }}
        >
          읽기 모드
        </button>

        <button
          type="button"
          className={`toolbar-btn${reading.highContrast ? ' on' : ''}`}
          aria-pressed={reading.highContrast}
          onClick={() => {
            sfx.blip()
            updateReading({ highContrast: !reading.highContrast })
          }}
        >
          고대비
        </button>
      </div>

      {tocOpen && sections.length > 1 && (
        <nav className="chapter-toc" aria-label="챕터 목차">
          <ol>
            {sections.map((title, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="toc-link"
                  onClick={() => {
                    document.getElementById(`sec-${i}`)?.scrollIntoView({ block: 'start' })
                    setTocOpen(false)
                  }}
                >
                  {title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <article className="chapter-body" ref={articleRef} style={bodyStyle}>
        <Markdown source={current.chapter.body} />
      </article>

      {current.chapter.check && current.chapter.check.length > 0 && (
        <CheckQuiz key={chapterId} questions={current.chapter.check} />
      )}

      <footer className="chapter-actions">
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

        {prev && (
          <button
            type="button"
            className="pixel-btn"
            onClick={() => {
              sfx.confirm()
              onOpenChapter(prev.chapter.id)
            }}
          >
            ◀ PREV
          </button>
        )}

        <button
          type="button"
          className={`pixel-btn complete-btn${read ? ' done' : ''}`}
          aria-pressed={read}
          title={read ? '다시 누르면 완료가 취소된다' : undefined}
          onClick={() => {
            if (read) {
              sfx.blip()
              uncompleteChapter(chapterId)
            } else {
              sfx.confirm()
              completeChapter(chapterId)
            }
          }}
        >
          {read ? '■ COMPLETED' : '□ 챕터 완료'}
        </button>

        {next && (
          <button
            type="button"
            className="pixel-btn"
            onClick={() => {
              sfx.confirm()
              onOpenChapter(next.chapter.id)
            }}
          >
            NEXT ▶
          </button>
        )}
      </footer>

      {showFunnel && (
        <FunnelSection
          heading={isVeryLast ? 'QUEST COMPLETE — NEXT LEVEL' : 'NEXT LEVEL'}
          compact={!isVeryLast}
        />
      )}
    </div>
  )
}
