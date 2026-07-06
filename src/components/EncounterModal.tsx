import { useEffect } from 'react'
import type { Encounter } from '../types/config'
import { sfx } from '../lib/sound'

interface Props {
  encounter: Encounter
  onClose: () => void
}

/** RANDOM ENCOUNTER 팝업 — 짧은 팁/미션 카드. Escape 또는 버튼으로 닫기 */
export function EncounterModal({ encounter, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="encounter-backdrop" onClick={onClose}>
      <div
        className="encounter-card"
        role="dialog"
        aria-modal="true"
        aria-label="랜덤 인카운터"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="encounter-header blink">‼ RANDOM ENCOUNTER ‼</p>
        {encounter.title && <p className="encounter-title">{encounter.title}</p>}
        <p className="encounter-text">{encounter.text}</p>
        <button
          type="button"
          className="pixel-btn"
          autoFocus
          onClick={() => {
            sfx.confirm()
            onClose()
          }}
        >
          확인 (OK)
        </button>
      </div>
    </div>
  )
}
