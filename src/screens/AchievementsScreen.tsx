import { config } from '../config'
import { Hud } from '../components/Hud'
import { useAchievements } from '../state/AchievementContext'
import { sfx } from '../lib/sound'

interface Props {
  onBackToMap: () => void
}

/** 업적 보관함 — 획득/미획득 업적을 한눈에 */
export function AchievementsScreen({ onBackToMap }: Props) {
  const { unlocked, isUnlocked } = useAchievements()

  return (
    <div className="screen achievements-screen">
      <Hud />

      <h2 className="section-title">— TROPHY ROOM —</h2>
      <p className="trophy-count">
        {unlocked.length} / {config.achievements.length} UNLOCKED
      </p>

      {config.achievements.length === 0 ? (
        <p className="empty-note">업적이 정의되지 않았다. content.ts 에 achievements 를 채워라.</p>
      ) : (
        <ul className="trophy-grid">
          {config.achievements.map((a) => {
            const got = isUnlocked(a.id)
            return (
              <li className={`trophy-card${got ? ' unlocked' : ''}`} key={a.id}>
                <span className="trophy-icon" aria-hidden="true">
                  {got ? (a.icon ?? '★') : '?'}
                </span>
                <span className="trophy-name">{a.name}</span>
                <span className="trophy-desc">{got ? a.description : '???'}</span>
                <span className="trophy-state">{got ? 'UNLOCKED' : 'LOCKED'}</span>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="pixel-btn ghost-btn"
        onClick={() => {
          sfx.blip()
          onBackToMap()
        }}
      >
        ■ MAP
      </button>
    </div>
  )
}
