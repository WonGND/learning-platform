import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { config, totalChapters } from '../config'
import { load, save } from '../lib/storage'
import { sfx } from '../lib/sound'
import { useProgress } from './ProgressContext'
import type { Achievement } from '../types/config'

interface AchievementValue {
  /** 획득한 업적 id 목록 */
  unlocked: string[]
  isUnlocked: (id: string) => boolean
}

const AchievementContext = createContext<AchievementValue | null>(null)

interface ProgressSnapshot {
  completed: string[]
  completedModeCount: number
  quizDone: boolean
}

function isSatisfied(a: Achievement, p: ProgressSnapshot): boolean {
  const cond = a.condition
  if (!cond) return false
  switch (cond.type) {
    case 'first_chapter':
      return p.completed.length >= 1
    case 'quiz_complete':
      return p.quizDone
    case 'mode_clear': {
      if (cond.modeId) {
        const mode = config.modes.find((m) => m.id === cond.modeId)
        return (
          !!mode && mode.chapters.length > 0 && mode.chapters.every((c) => p.completed.includes(c.id))
        )
      }
      return p.completedModeCount >= 1
    }
    case 'chapters_completed':
      return p.completed.length >= cond.count
    case 'all_clear':
      return totalChapters > 0 && p.completed.length >= totalChapters
    default:
      // content.ts 에 알 수 없는 조건 타입이 있어도 앱은 계속 동작
      return false
  }
}

function loadUnlocked(): string[] {
  const raw = load<unknown>('achievements', [])
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string')
}

/**
 * 업적 엔진 — 진행 상태가 바뀔 때마다 조건을 평가해 새로 충족된 업적을
 * 획득 처리(저장 + 토스트 + 팡파레)한다. 토스트는 큐로 순차 표시.
 */
export function AchievementProvider({ children }: { children: ReactNode }) {
  const { completed, completedModeCount, quizResult } = useProgress()
  const [unlocked, setUnlocked] = useState<string[]>(loadUnlocked)
  const [toastQueue, setToastQueue] = useState<Achievement[]>([])

  useEffect(() => {
    const snapshot: ProgressSnapshot = {
      completed,
      completedModeCount,
      quizDone: quizResult !== null,
    }
    const newly = config.achievements.filter(
      (a) => !unlocked.includes(a.id) && isSatisfied(a, snapshot),
    )
    if (newly.length === 0) return
    const next = [...unlocked, ...newly.map((a) => a.id)]
    setUnlocked(next)
    save('achievements', next)
    setToastQueue((q) => [...q, ...newly])
    sfx.achievement()
  }, [completed, completedModeCount, quizResult, unlocked])

  // 토스트 큐: 맨 앞 항목을 3.2초 표시 후 제거
  useEffect(() => {
    if (toastQueue.length === 0) return
    const t = setTimeout(() => setToastQueue((q) => q.slice(1)), 3200)
    return () => clearTimeout(t)
  }, [toastQueue])

  const isUnlocked = useCallback((id: string) => unlocked.includes(id), [unlocked])
  const value = useMemo(() => ({ unlocked, isUnlocked }), [unlocked, isUnlocked])
  const toast = toastQueue[0]

  return (
    <AchievementContext.Provider value={value}>
      {children}
      {toast && (
        <div className="achievement-toast" role="status" aria-live="polite">
          <span className="toast-icon" aria-hidden="true">
            {toast.icon ?? '★'}
          </span>
          <span className="toast-body">
            <span className="toast-label">ACHIEVEMENT UNLOCKED</span>
            <span className="toast-name">{toast.name}</span>
          </span>
        </div>
      )}
    </AchievementContext.Provider>
  )
}

export function useAchievements(): AchievementValue {
  const ctx = useContext(AchievementContext)
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider')
  return ctx
}
