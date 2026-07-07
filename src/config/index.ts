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
    funnel: { ...FALLBACK.funnel, ...raw.funnel, blocks: raw.funnel?.blocks ?? [] },
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
 * 멤버십 게이트: gateAfterChapter(1-based) 이후 챕터는 해제 전까지 잠금.
 * 주의 — 클라이언트 검증이므로 "무료 멤버십 유도" 용도로만 쓰고,
 * 이 코드로 유료 콘텐츠를 보호하지 마라.
 */
export function isChapterLocked(chapterId: string, membershipUnlocked: boolean): boolean {
  if (membershipUnlocked) return false
  const gate = config.membership.gateAfterChapter
  if (typeof gate !== 'number' || !Number.isFinite(gate)) return false
  const idx = globalChapterIndex(chapterId)
  return idx > 0 && idx > gate
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
