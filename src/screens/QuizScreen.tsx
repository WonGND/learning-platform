import { useEffect, useMemo, useState } from 'react'
import { config } from '../config'
import { useProgress } from '../state/ProgressContext'
import { sfx } from '../lib/sound'
import type { RecommendedClass } from '../types/config'

interface Props {
  onOpenChapter: (chapterId: string) => void
  onBackToMap: () => void
}

/** 총점으로 클래스 판정. 범위 밖이면 가장 가까운 클래스로 폴백 (설정 오류 방어) */
function judgeClass(score: number): RecommendedClass | null {
  const classes = config.classes
  if (classes.length === 0) return null
  const hit = classes.find((c) => score >= c.minScore && score <= c.maxScore)
  if (hit) return hit
  return [...classes].sort(
    (a, b) =>
      Math.min(Math.abs(score - a.minScore), Math.abs(score - a.maxScore)) -
      Math.min(Math.abs(score - b.minScore), Math.abs(score - b.maxScore)),
  )[0]
}

/** 추천 시작 챕터가 실제로 존재하는지 확인 (없으면 null → CTA를 월드맵으로 대체) */
function findStartChapter(cls: RecommendedClass) {
  for (const mode of config.modes) {
    for (const chapter of mode.chapters) {
      if (chapter.id === cls.startChapterId) return { mode, chapter }
    }
  }
  const mode = config.modes.find((m) => m.id === cls.startModeId)
  if (mode && mode.chapters.length > 0) return { mode, chapter: mode.chapters[0] }
  return null
}

/**
 * 진단 퀴즈 (CLASS CHECK) — 문항을 한 개씩 제시, 선택 즉시 다음 문항으로.
 * 8문항 기준 30초 내 완료 가능한 경량 UX. 완료 시 클래스 판정 + 추천 시작점 CTA.
 */
export function QuizScreen({ onOpenChapter, onBackToMap }: Props) {
  const { saveQuizResult } = useProgress()
  const quiz = config.quiz
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const finished = quiz.length > 0 && answers.length === quiz.length
  const score = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers])
  const result = useMemo(() => (finished ? judgeClass(score) : null), [finished, score])
  const start = useMemo(() => (result ? findStartChapter(result) : null), [result])

  // 문항이 없으면 진입 자체가 무의미 → 월드맵으로
  useEffect(() => {
    if (quiz.length === 0) onBackToMap()
  }, [quiz.length, onBackToMap])

  // 판정 확정 시 결과 저장 (M4 업적 트리거로도 사용)
  useEffect(() => {
    if (finished && result) {
      saveQuizResult({ classId: result.id, score })
      sfx.start()
    }
  }, [finished, result, score, saveQuizResult])

  if (quiz.length === 0) return null

  // ---------- 결과 화면 ----------
  if (finished) {
    return (
      <div className="screen quiz-screen">
        <h2 className="section-title">— CLASS CHECK RESULT —</h2>

        {result ? (
          <div className="quiz-result" role="status">
            <p className="result-label">YOUR CLASS</p>
            <p className="result-class">{result.name}</p>
            <p className="result-score">
              SCORE {score} / {quiz.reduce((n, q) => n + Math.max(...q.options.map((o) => o.score), 0), 0)}
            </p>
            <p className="result-desc">{result.description}</p>

            {config.modes.length > 0 && (
              <div className="path-list">
                <p className="path-title">추천 학습 경로</p>
                <ol>
                  {config.modes.map((m, i) => {
                    const startIdx = config.modes.findIndex((x) => x.id === result.startModeId)
                    const role = i < startIdx ? '복습 · 선택' : i === startIdx ? '◀ 여기서 시작' : '다음 목표'
                    return (
                      <li key={m.id} className={i < startIdx ? 'dim' : i === startIdx ? 'here' : ''}>
                        {m.name} <span className="path-role">{role}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}

            {start ? (
              <button
                type="button"
                className="pixel-btn start-btn"
                autoFocus
                onClick={() => {
                  sfx.confirm()
                  onOpenChapter(start.chapter.id)
                }}
              >
                ▶ {start.mode.name} · {start.chapter.title} 시작
              </button>
            ) : (
              <button type="button" className="pixel-btn start-btn" autoFocus onClick={onBackToMap}>
                ▶ 월드맵에서 시작하기
              </button>
            )}
          </div>
        ) : (
          <p className="empty-note">클래스 정보가 없다. content.ts 에 classes 를 채워라.</p>
        )}

        <div className="quiz-footer-actions">
          <button
            type="button"
            className="pixel-btn ghost-btn"
            onClick={() => {
              sfx.blip()
              setAnswers([])
              setStep(0)
            }}
          >
            ↺ RETRY
          </button>
          <button type="button" className="pixel-btn ghost-btn" onClick={onBackToMap}>
            ■ MAP
          </button>
        </div>
      </div>
    )
  }

  // ---------- 문항 화면 ----------
  const q = quiz[step]
  const progressPct = Math.round((step / quiz.length) * 100)

  return (
    <div className="screen quiz-screen">
      <h2 className="section-title">— CLASS CHECK —</h2>

      <div className="quiz-progress" aria-label={`진행률: ${quiz.length}문항 중 ${step + 1}번째`}>
        <span className="quiz-step">
          Q{step + 1}/{quiz.length}
        </span>
        <div className="quiz-bar" aria-hidden="true">
          <div className="quiz-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <p className="quiz-question">{q.question}</p>

      <div className="quiz-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className="pixel-btn quiz-option"
            onClick={() => {
              sfx.blip()
              setAnswers((prev) => [...prev, opt.score])
              setStep((s) => Math.min(s + 1, quiz.length - 1))
            }}
          >
            <span className="quiz-option-key" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="quiz-footer-actions">
        {step > 0 && (
          <button
            type="button"
            className="pixel-btn ghost-btn"
            onClick={() => {
              sfx.blip()
              setAnswers((prev) => prev.slice(0, -1))
              setStep((s) => Math.max(s - 1, 0))
            }}
          >
            ◀ PREV
          </button>
        )}
        <button type="button" className="pixel-btn ghost-btn" onClick={onBackToMap}>
          ✕ QUIT
        </button>
      </div>
    </div>
  )
}
