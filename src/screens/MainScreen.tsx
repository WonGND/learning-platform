import { config, totalChapters } from '../config'
import { sfx } from '../lib/sound'

interface Props {
  onBackToTitle: () => void
}

/**
 * 메인 화면 (M1 셸) — config 기반으로 월드맵 미리보기를 렌더링한다.
 * 인터랙티브 월드맵/챕터 뷰어/진행 저장은 M2에서 구현.
 */
export function MainScreen({ onBackToTitle }: Props) {
  return (
    <div className="screen main-screen">
      <header className="hud">
        <span className="hud-brand">{config.brand.title}</span>
        <span className="hud-stats" aria-label="능력치 카운터">
          MODE 0/{config.modes.length} · CHAPTER 0/{totalChapters} · TIME 00:00
        </span>
      </header>

      <section className="worldmap-preview">
        <h2 className="section-title">— WORLD MAP —</h2>
        {config.modes.length === 0 ? (
          <p className="empty-note">콘텐츠가 아직 없다. content.ts 에 modes 를 채워라.</p>
        ) : (
          <ul className="mode-list">
            {config.modes.map((mode, i) => (
              <li className="mode-card" key={mode.id}>
                <div className="mode-card-head">
                  <span className="mode-index">STAGE {i + 1}</span>
                  <span className="mode-name">{mode.name}</span>
                </div>
                <p className="mode-desc">{mode.description}</p>
                <p className="mode-meta">{mode.chapters.length} CHAPTERS · 🔒 M2에서 개방</p>
              </li>
            ))}
          </ul>
        )}
        <p className="milestone-note">
          [M1 빌드] 월드맵 탐험·챕터 뷰어·진행률 저장은 M2에서 활성화된다.
        </p>
      </section>

      <button
        type="button"
        className="pixel-btn ghost-btn"
        onClick={() => {
          sfx.blip()
          onBackToTitle()
        }}
      >
        ◀ TITLE
      </button>
    </div>
  )
}
