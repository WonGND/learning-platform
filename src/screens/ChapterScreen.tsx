import { useEffect } from 'react'
import { config } from '../config'
import { Hud } from '../components/Hud'
import { Markdown } from '../components/Markdown'
import { useProgress } from '../state/ProgressContext'
import { sfx } from '../lib/sound'

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

/** 챕터 뷰어 — 마크다운 본문 렌더링 + 완료 처리 + 이전/다음 챕터 이동 */
export function ChapterScreen({ chapterId, onOpenChapter, onBackToMap }: Props) {
  const { isCompleted, completeChapter } = useProgress()
  const { current, prev, next } = locate(chapterId)

  // 잘못된 챕터 id 방어: 월드맵으로 복귀
  useEffect(() => {
    if (!current) onBackToMap()
  }, [current, onBackToMap])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [chapterId])

  if (!current) return null

  const read = isCompleted(chapterId)

  return (
    <div className="screen chapter-screen">
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

      <article className="chapter-body">
        <Markdown source={current.chapter.body} />
      </article>

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
          disabled={read}
          onClick={() => {
            sfx.confirm()
            completeChapter(chapterId)
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
    </div>
  )
}
