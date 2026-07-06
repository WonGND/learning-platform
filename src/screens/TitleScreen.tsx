import { config } from '../config'
import { sfx } from '../lib/sound'

interface Props {
  onStart: () => void
  onClassCheck: () => void
  onReplayBoot: () => void
}

/** 타이틀 화면 — 로고 + PLAYER 1 START + CLASS CHECK */
export function TitleScreen({ onStart, onClassCheck, onReplayBoot }: Props) {
  const hasQuiz = config.quiz.length > 0 && config.classes.length > 0
  return (
    <div className="screen title-screen">
      {config.brand.logoAscii && (
        <pre className="logo-ascii" aria-hidden="true">
          {config.brand.logoAscii}
        </pre>
      )}
      <h1 className="title-name">{config.brand.title}</h1>
      <p className="title-subtitle">{config.brand.subtitle}</p>

      <button
        type="button"
        className="pixel-btn start-btn blink"
        autoFocus
        onClick={() => {
          sfx.start()
          onStart()
        }}
      >
        ▶ PLAYER 1 START
      </button>

      {hasQuiz && (
        <button
          type="button"
          className="pixel-btn class-check-btn"
          onClick={() => {
            sfx.confirm()
            onClassCheck()
          }}
        >
          ◈ CLASS CHECK (30초 진단)
        </button>
      )}

      <button
        type="button"
        className="pixel-btn ghost-btn"
        onClick={() => {
          sfx.blip()
          onReplayBoot()
        }}
      >
        REPLAY INTRO
      </button>

      <p className="title-footer">© 2026 {config.brand.title} — INSERT COIN TO LEARN</p>
    </div>
  )
}
