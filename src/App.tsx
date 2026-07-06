import { useCallback, useEffect, useState } from 'react'
import { BootScreen } from './screens/BootScreen'
import { TitleScreen } from './screens/TitleScreen'
import { MainScreen } from './screens/MainScreen'
import { MuteToggle } from './components/MuteToggle'
import { load, save } from './lib/storage'

type Screen = 'boot' | 'title' | 'main'

/**
 * 화면 상태 머신 (라우터 대신 단일 페이지 상태 전환 채택 —
 * 레트로 게임의 "장면 전환" 감성과 맞고 딥링크가 필요 없는 구조).
 * 재방문 시(visited 플래그) 부팅을 건너뛰고 타이틀로 직행한다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    load<boolean>('visited', false) ? 'title' : 'boot',
  )

  useEffect(() => {
    if (screen !== 'boot') save('visited', true)
  }, [screen])

  const toTitle = useCallback(() => setScreen('title'), [])
  const toMain = useCallback(() => setScreen('main'), [])
  const toBoot = useCallback(() => setScreen('boot'), [])

  return (
    <div className="crt">
      <MuteToggle />
      {screen === 'boot' && <BootScreen onDone={toTitle} />}
      {screen === 'title' && <TitleScreen onStart={toMain} onReplayBoot={toBoot} />}
      {screen === 'main' && <MainScreen onBackToTitle={toTitle} />}
    </div>
  )
}
