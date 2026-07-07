import { useState } from 'react'
import type { CheckQuestion } from '../types/config'
import { sfx } from '../lib/sound'

interface Props {
  questions: CheckQuestion[]
}

/**
 * 챕터 말미 지식 확인 — 선택 즉시 정답/오답 + 해설 표시, 재선택 허용.
 * 점수 저장은 하지 않는다 (부담 없는 자기 점검 장치).
 */
export function CheckQuiz({ questions }: Props) {
  const [picked, setPicked] = useState<Record<number, number>>({})

  if (questions.length === 0) return null

  return (
    <section className="check-quiz" aria-label="지식 확인">
      <h2 className="section-title">— KNOWLEDGE CHECK —</h2>
      {questions.map((q, qi) => {
        const sel = picked[qi]
        const answered = sel !== undefined
        const correct = answered && sel === q.answerIndex
        return (
          <div className="check-item" key={qi}>
            <p className="check-question">
              Q{qi + 1}. {q.question}
            </p>
            <div className="check-options">
              {q.options.map((opt, oi) => {
                const isSel = sel === oi
                const isAnswer = answered && oi === q.answerIndex
                return (
                  <button
                    key={oi}
                    type="button"
                    className={`check-option${isSel ? ' selected' : ''}${
                      answered && isAnswer ? ' answer' : ''
                    }${isSel && !correct ? ' wrong' : ''}`}
                    onClick={() => {
                      const ok = oi === q.answerIndex
                      if (ok) sfx.confirm()
                      else sfx.error()
                      setPicked((p) => ({ ...p, [qi]: oi }))
                    }}
                  >
                    <span className="quiz-option-key" aria-hidden="true">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {answered && (
              <p className={`check-feedback${correct ? ' ok' : ''}`} role="status">
                {correct ? '◎ 정답!' : '✕ 오답'}
                {q.explanation ? ` — ${q.explanation}` : ''}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
