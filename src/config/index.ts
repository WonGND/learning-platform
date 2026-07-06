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
