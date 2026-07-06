import { useEffect, useMemo, useRef, useState } from 'react'
import { config } from '../config'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { sfx } from '../lib/sound'

interface Props {
  onDone: () => void
}

/**
 * BIOS 부팅 시퀀스 — config.boot.lines 를 durationMs 동안 타이핑한다.
 * 클릭 / Enter / Space / Escape 로 언제든 스킵 가능.
 * prefers-reduced-motion 이면 애니메이션 없이 전체 텍스트를 즉시 표시.
 */
export function BootScreen({ onDone }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const lines = config.boot.lines
  const totalChars = useMemo(() => lines.reduce((n, l) => n + Math.max(l.length, 1), 0), [lines])
  const [charCount, setCharCount] = useState(reducedMotion ? totalChars : 0)
  const doneRef = useRef(false)

  const finished = charCount >= totalChars

  // 타이핑 애니메이션
  useEffect(() => {
    if (reducedMotion || finished) return
    const interval = Math.max(config.boot.durationMs / totalChars, 8)
    const timer = setInterval(() => {
      setCharCount((c) => {
        if (c % 7 === 0) sfx.tick()
        return Math.min(c + 1, totalChars)
      })
    }, interval)
    return () => clearInterval(timer)
  }, [reducedMotion, finished, totalChars])

  // 완료 후 잠시 여운을 두고 다음 화면으로
  useEffect(() => {
    if (!finished || doneRef.current) return
    const t = setTimeout(() => {
      doneRef.current = true
      onDone()
    }, reducedMotion ? 400 : 900)
    return () => clearTimeout(t)
  }, [finished, reducedMotion, onDone])

  // 스킵: 클릭 또는 키보드
  useEffect(() => {
    const skip = () => {
      if (doneRef.current) return
      doneRef.current = true
      onDone()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  // charCount 를 라인별 표시 텍스트로 변환
  let remaining = charCount
  const visible: string[] = []
  for (const line of lines) {
    const cost = Math.max(line.length, 1)
    if (remaining <= 0) break
    visible.push(line.slice(0, Math.min(remaining, line.length)))
    remaining -= cost
  }

  return (
    <div className="screen boot-screen" onClick={() => !doneRef.current && onDone()}>
      <div className="boot-lines" role="log" aria-live="polite">
        {visible.map((line, i) => (
          <div className="boot-line" key={i}>
            {line || ' '}
            {i === visible.length - 1 && !finished && <span className="cursor" aria-hidden="true">█</span>}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="pixel-btn boot-skip"
        onClick={(e) => {
          e.stopPropagation()
          if (!doneRef.current) {
            doneRef.current = true
            onDone()
          }
        }}
      >
        SKIP ▶▶
      </button>
    </div>
  )
}
