import { useState } from 'react'
import {
  config,
  isChapterLocked,
  totalChapters,
  findChapterEntry,
  firstUncompletedChapterId,
} from '../config'
import { Hud } from '../components/Hud'
import { useProgress } from '../state/ProgressContext'
import { useEntitlement } from '../state/EntitlementContext'
import { sfx } from '../lib/sound'

interface Props {
  onOpenChapter: (chapterId: string) => void
  onClassCheck: () => void
  onOpenAchievements: () => void
  onBackToTitle: () => void
}

/**
 * 학습 월드맵 — 모드(스테이지)를 세로 맵으로 시각화.
 * 모드 클릭 시 챕터 목차가 펼쳐지고, 완료한 챕터에는 읽음 표시가 붙는다.
 */
export function WorldMapScreen({
  onOpenChapter,
  onClassCheck,
  onOpenAchievements,
  onBackToTitle,
}: Props) {
  const { isCompleted, quizResult, completed, lastChapterId } = useProgress()
  const { hasPaidAccess } = useEntitlement()
  const pct = totalChapters > 0 ? Math.round((completed.length / totalChapters) * 100) : 0
  const allDone = totalChapters > 0 && completed.length >= totalChapters
  const continueId =
    (lastChapterId && !isCompleted(lastChapterId) && findChapterEntry(lastChapterId)
      ? lastChapterId
      : null) ?? firstUncompletedChapterId(completed)
  const continueEntry = continueId ? findChapterEntry(continueId) : null
  const playerClass = quizResult ? config.classes.find((c) => c.id === quizResult.classId) : null
  const hasQuiz = config.quiz.length > 0 && config.classes.length > 0
  // 기본으로 첫 번째 미완료 모드를 펼쳐 보여준다
  const firstOpen = config.modes.findIndex((m) => m.chapters.some((c) => !isCompleted(c.id)))
  const [openModeId, setOpenModeId] = useState<string | null>(
    config.modes[firstOpen === -1 ? 0 : firstOpen]?.id ?? null,
  )

  const toggleMode = (modeId: string) => {
    sfx.blip()
    setOpenModeId((cur) => (cur === modeId ? null : modeId))
  }

  // 챕터 검색: 제목·요약 대상, 입력 시 아코디언 대신 평면 결과 목록
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const searchResults = q
    ? config.modes.flatMap((mode) =>
        mode.chapters
          .filter(
            (ch) =>
              ch.title.toLowerCase().includes(q) || ch.summary.toLowerCase().includes(q),
          )
          .map((chapter) => ({ mode, chapter })),
      )
    : null

  return (
    <div className="screen main-screen">
      <Hud />

      <div className="map-progress" aria-label={`전체 완주율 ${pct}%`}>
        <span className="map-progress-label">TOTAL {pct}%</span>
        <div className="quiz-bar" aria-hidden="true">
          <div className="quiz-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {allDone ? (
        <div className="complete-banner" role="status">
          🏆 QUEST COMPLETE — 모든 챕터를 완주했다{playerClass ? `, ${playerClass.name}` : ''}!
        </div>
      ) : (
        continueEntry &&
        continueId && (
          <button
            type="button"
            className="pixel-btn continue-btn map-continue"
            onClick={() => {
              sfx.confirm()
              onOpenChapter(continueId)
            }}
          >
            ↻ CONTINUE — {continueEntry.mode.name} · {continueEntry.chapter.title}
          </button>
        )
      )}

      <section className="worldmap">
        <h2 className="section-title">— WORLD MAP —</h2>
        {playerClass && <p className="player-class">CLASS: {playerClass.name}</p>}

        {config.modes.length > 0 && (
          <div className="map-search">
            <input
              type="search"
              className="map-search-input"
              placeholder="챕터 검색…"
              value={query}
              aria-label="챕터 검색"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        {searchResults && (
          <ul className="chapter-list search-results" aria-label="검색 결과">
            {searchResults.length === 0 && <li className="empty-note">일치하는 챕터가 없다.</li>}
            {searchResults.map(({ mode, chapter }) => {
              const readCh = isCompleted(chapter.id)
              const locked = isChapterLocked(chapter.id, hasPaidAccess)
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className={`chapter-row${readCh ? ' read' : ''}${locked ? ' locked' : ''}`}
                    onClick={() => {
                      sfx.confirm()
                      onOpenChapter(chapter.id)
                    }}
                  >
                    <span className="chapter-mark" aria-hidden="true">
                      {locked ? '🔒' : readCh ? '■' : '□'}
                    </span>
                    <span className="chapter-title">{chapter.title}</span>
                    <span className="chapter-summary">
                      {mode.name} · {chapter.summary}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {!searchResults && (config.modes.length === 0 ? (
          <p className="empty-note">콘텐츠가 아직 없다. content.ts 에 modes 를 채워라.</p>
        ) : (
          <ul className="mode-list">
            {config.modes.map((mode, i) => {
              const done = mode.chapters.filter((c) => isCompleted(c.id)).length
              const total = mode.chapters.length
              const cleared = total > 0 && done === total
              const open = openModeId === mode.id
              return (
                <li className={`mode-card${cleared ? ' cleared' : ''}`} key={mode.id}>
                  <button
                    type="button"
                    className="mode-toggle"
                    aria-expanded={open}
                    onClick={() => toggleMode(mode.id)}
                  >
                    <span className="mode-card-head">
                      <span className="mode-index">STAGE {i + 1}</span>
                      <span className="mode-name">{mode.name}</span>
                      <span className={`mode-clear${cleared ? ' on' : ''}`}>
                        {cleared ? '★ CLEAR' : `${done}/${total}`}
                      </span>
                      <span className="mode-arrow" aria-hidden="true">
                        {open ? '▼' : '▶'}
                      </span>
                    </span>
                    <span className="mode-desc">{mode.description}</span>
                  </button>

                  {open && (
                    <ul className="chapter-list">
                      {mode.chapters.map((ch) => {
                        const read = isCompleted(ch.id)
                        const locked = isChapterLocked(ch.id, hasPaidAccess)
                        return (
                          <li key={ch.id}>
                            <button
                              type="button"
                              className={`chapter-row${read ? ' read' : ''}${locked ? ' locked' : ''}`}
                              aria-label={locked ? `${ch.title} (멤버십 잠금)` : undefined}
                              onClick={() => {
                                sfx.confirm()
                                onOpenChapter(ch.id)
                              }}
                            >
                              <span className="chapter-mark" aria-hidden="true">
                                {locked ? '🔒' : read ? '■' : '□'}
                              </span>
                              <span className="chapter-title">{ch.title}</span>
                              <span className="chapter-summary">{ch.summary}</span>
                              {locked ? (
                                <span className="chapter-lock-badge">MEMBERS</span>
                              ) : (
                                read && <span className="chapter-read-badge">READ</span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        ))}
      </section>

      <div className="map-footer-actions">
        {config.achievements.length > 0 && (
          <button
            type="button"
            className="pixel-btn ghost-btn"
            onClick={() => {
              sfx.confirm()
              onOpenAchievements()
            }}
          >
            ★ TROPHY
          </button>
        )}
        {hasQuiz && (
          <button
            type="button"
            className="pixel-btn ghost-btn"
            onClick={() => {
              sfx.confirm()
              onClassCheck()
            }}
          >
            ◈ CLASS CHECK
          </button>
        )}
        <button
          type="button"
          className="pixel-btn ghost-btn"
          onClick={() => {
            sfx.blip()
            onBackToTitle()
          }}
        >
          ◀ TITLE
        </button>
      </div>
    </div>
  )
}
