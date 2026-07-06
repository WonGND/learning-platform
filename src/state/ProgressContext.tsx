import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { config } from '../config'
import { load, save } from '../lib/storage'

export interface QuizResult {
  classId: string
  score: number
}

interface ProgressValue {
  /** 완료한 챕터 id 목록 */
  completed: string[]
  /** 누적 플레이 타임 (ms) */
  playtimeMs: number
  completeChapter: (chapterId: string) => void
  isCompleted: (chapterId: string) => boolean
  /** 모든 챕터가 완료된 모드 수 */
  completedModeCount: number
  /** 진단 퀴즈 결과 (미응시면 null) */
  quizResult: QuizResult | null
  saveQuizResult: (result: QuizResult) => void
  /** 멤버십 게이트 해제 여부 */
  membershipUnlocked: boolean
  /** 입장 코드 검증. 성공 시 해제 상태를 저장하고 true 반환 */
  tryUnlockMembership: (code: string) => boolean
}

const ProgressContext = createContext<ProgressValue | null>(null)

function loadCompleted(): string[] {
  const raw = load<unknown>('completed', [])
  // 손상 데이터 방어: 문자열 배열이 아니면 초기화
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string')
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<string[]>(loadCompleted)
  const [playtimeMs, setPlaytimeMs] = useState<number>(() => {
    const raw = load<unknown>('playtimeMs', 0)
    return typeof raw === 'number' && raw >= 0 ? raw : 0
  })

  // 플레이 타임: 탭이 보이는 동안 1초 단위로 누적
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setPlaytimeMs((ms) => {
        const next = ms + 1000
        save('playtimeMs', next)
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const [quizResult, setQuizResult] = useState<QuizResult | null>(() => {
    const raw = load<unknown>('quizResult', null)
    if (
      raw &&
      typeof raw === 'object' &&
      typeof (raw as QuizResult).classId === 'string' &&
      typeof (raw as QuizResult).score === 'number'
    ) {
      return raw as QuizResult
    }
    return null
  })

  const saveQuizResult = useCallback((result: QuizResult) => {
    setQuizResult(result)
    save('quizResult', result)
  }, [])

  const [membershipUnlocked, setMembershipUnlocked] = useState<boolean>(
    () => load<unknown>('membership', false) === true,
  )

  // 클라이언트 검증 — 무료 멤버십 유도 용도로만 사용 (유료 콘텐츠 보호 불가)
  const tryUnlockMembership = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase()
    const ok = config.membership.validCodes.some((c) => c.trim().toUpperCase() === normalized)
    if (ok) {
      setMembershipUnlocked(true)
      save('membership', true)
    }
    return ok
  }, [])

  const completeChapter = useCallback((chapterId: string) => {
    setCompleted((prev) => {
      if (prev.includes(chapterId)) return prev
      const next = [...prev, chapterId]
      save('completed', next)
      return next
    })
  }, [])

  const isCompleted = useCallback((chapterId: string) => completed.includes(chapterId), [completed])

  const completedModeCount = useMemo(
    () =>
      config.modes.filter(
        (m) => m.chapters.length > 0 && m.chapters.every((c) => completed.includes(c.id)),
      ).length,
    [completed],
  )

  const value = useMemo(
    () => ({
      completed,
      playtimeMs,
      completeChapter,
      isCompleted,
      completedModeCount,
      quizResult,
      saveQuizResult,
      membershipUnlocked,
      tryUnlockMembership,
    }),
    [
      completed,
      playtimeMs,
      completeChapter,
      isCompleted,
      completedModeCount,
      quizResult,
      saveQuizResult,
      membershipUnlocked,
      tryUnlockMembership,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
