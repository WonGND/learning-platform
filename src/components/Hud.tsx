import { config, totalChapters } from '../config'
import { useProgress } from '../state/ProgressContext'

function formatPlaytime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 상단 능력치 카운터: 완료 모드 / 완료 챕터 / 누적 플레이 타임 */
export function Hud() {
  const { completed, completedModeCount, playtimeMs } = useProgress()

  return (
    <header className="hud">
      <span className="hud-brand">{config.brand.title}</span>
      <span className="hud-stats" aria-label="능력치 카운터">
        MODE {completedModeCount}/{config.modes.length} · CHAPTER {completed.length}/{totalChapters} ·
        TIME {formatPlaytime(playtimeMs)}
      </span>
    </header>
  )
}
