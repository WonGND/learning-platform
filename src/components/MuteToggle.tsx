import { useState } from 'react'
import { isMuted, setMuted, sfx } from '../lib/sound'

/** 상시 노출되는 배경 사운드 음소거 토글 */
export function MuteToggle() {
  const [muted, setMutedState] = useState(isMuted())

  const toggle = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    if (!next) sfx.blip()
  }

  return (
    <button
      type="button"
      className="mute-toggle"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      title={muted ? '소리 켜기' : '소리 끄기'}
    >
      {muted ? '♪ OFF' : '♪ ON'}
    </button>
  )
}
