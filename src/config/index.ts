import type { AppConfig, PartialAppConfig } from '../types/config'
import { content } from './content'

/**
 * content.ts 의 필드 누락/오타에도 앱이 죽지 않도록 안전한 기본값과 병합한다.
 * 빈 배열인 섹션은 각 화면에서 자연스럽게 숨긴다.
 */
const FALLBACK: AppConfig = {
  brand: { title: 'RETRO ACADEMY', subtitle: 'INSERT COIN TO LEARN' },
  boot: { lines: ['SYSTEM BOOT ... OK', 'PRESS START'], durationMs: 2000 },
  modes: [],
  quiz: [],
  classes: [],
  achievements: [],
  funnel: { ctaText: '', url: '', blocks: [] },
  membership: { validCodes: [], channelUrl: '', gateAfterChapter: Infinity },
}

function normalize(raw: PartialAppConfig): AppConfig {
  return {
    brand: { ...FALLBACK.brand, ...raw.brand },
    boot: {
      lines: raw.boot?.lines?.length ? raw.boot.lines : FALLBACK.boot.lines,
      durationMs:
        raw.boot?.durationMs && raw.boot.durationMs > 0
          ? raw.boot.durationMs
          : FALLBACK.boot.durationMs,
    },
    modes: raw.modes ?? [],
    quiz: raw.quiz ?? [],
    classes: raw.classes ?? [],
    achievements: raw.achievements ?? [],
    encounters: raw.encounters ?? [],
    principles: raw.principles,
    cases: raw.cases,
    funnel: {
      ...FALLBACK.funnel,
      ...raw.funnel,
      blocks: raw.funnel?.blocks ?? [],
      testimonials: raw.funnel?.testimonials ?? [],
    },
    membership: {
      ...FALLBACK.membership,
      ...raw.membership,
      validCodes: raw.membership?.validCodes ?? [],
    },
  }
}

export const config: AppConfig = normalize(content ?? {})

/** 전체 챕터 수 (통계·게이트 계산에 사용) */
export const totalChapters = config.modes.reduce((n, m) => n + m.chapters.length, 0)

/** 전체 챕터 평탄화 순서에서의 1-based 위치. 없으면 -1 */
export function globalChapterIndex(chapterId: string): number {
  let i = 0
  for (const mode of config.modes) {
    for (const chapter of mode.chapters) {
      i += 1
      if (chapter.id === chapterId) return i
    }
  }
  return -1
}

/**
 * 유료 챕터 잠금 판정 — 챕터의 paid 플래그와 서버 엔타이틀먼트로만 결정한다.
 * hasPaidAccess 는 Supabase 세션 + entitlements/is_admin 을 서버에서 검증한 결과다
 * (EntitlementContext). 클라이언트 localStorage 로 우회할 수 없다.
 *
 * 주의: 이것은 UX 표시용 잠금이다. 진짜 보안 경계는 유료 본문이 레포·번들에 없고
 * paid_chapters RLS 로 권한자에게만 반환된다는 사실이다.
 */
export function isChapterLocked(chapterId: string, hasPaidAccess: boolean): boolean {
  const entry = findChapterEntry(chapterId)
  if (!entry) return false
  return entry.chapter.paid === true && !hasPaidAccess
}

/** 챕터 id로 모드·챕터 엔트리 조회 */
export function findChapterEntry(chapterId: string) {
  for (const mode of config.modes) {
    for (const chapter of mode.chapters) {
      if (chapter.id === chapterId) return { mode, chapter }
    }
  }
  return null
}

/** 전체 순서 기준 첫 미완료 챕터 id ("이어서 학습" 기본 진입점) */
export function firstUncompletedChapterId(completed: string[]): string | null {
  for (const mode of config.modes) {
    for (const chapter of mode.chapters) {
      if (!completed.includes(chapter.id)) return chapter.id
    }
  }
  return null
}
