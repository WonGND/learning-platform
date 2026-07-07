import { useCallback, useState } from 'react'
import { load, save } from '../lib/storage'

/** 본문 가독성 옵션 — 감성 연출보다 학습 효율 우선 (본문 화면에 한해 적용) */
export interface ReadingSettings {
  /** 본문 글자 배율 (0.85 ~ 1.4) */
  fontScale: number
  /** 읽기 모드: 도트 폰트·글로우·스캔라인을 본문에서 약화 */
  readMode: boolean
  /** 고대비: 순검정 배경 + 순백 본문 */
  highContrast: boolean
}

const DEFAULTS: ReadingSettings = { fontScale: 1, readMode: false, highContrast: false }
export const FONT_SCALE_MIN = 0.85
export const FONT_SCALE_MAX = 1.4
export const FONT_SCALE_STEP = 0.1

function loadSettings(): ReadingSettings {
  const raw = load<Partial<ReadingSettings>>('reading', DEFAULTS)
  return {
    fontScale:
      typeof raw.fontScale === 'number'
        ? Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, raw.fontScale))
        : DEFAULTS.fontScale,
    readMode: raw.readMode === true,
    highContrast: raw.highContrast === true,
  }
}

export function useReadingSettings(): [ReadingSettings, (patch: Partial<ReadingSettings>) => void] {
  const [settings, setSettings] = useState<ReadingSettings>(loadSettings)

  const update = useCallback((patch: Partial<ReadingSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      next.fontScale = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, next.fontScale))
      save('reading', next)
      return next
    })
  }, [])

  return [settings, update]
}
