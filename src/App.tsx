import { useCallback, useEffect, useState } from 'react'
import { BootScreen } from './screens/BootScreen'
import { TitleScreen } from './screens/TitleScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { ChapterScreen } from './screens/ChapterScreen'
import { QuizScreen } from './screens/QuizScreen'
import { MuteToggle } from './components/MuteToggle'
import { ProgressProvider } from './state/ProgressContext'
import { load, save } from './lib/storage'

type Screen = 'boot' | 'title' | 'map' | 'chapter' | 'quiz'

/**
 * 화면 상태 머신 (라우터 대신 단일 페이지 상태 전환 —
 * 레트로 게임의 "장면 전환" 감성과 맞고 딥링크가 필요 없는 구조).
 * boot → title → map ⇄ chapter. 재방문 시 부팅을 건너뛴다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    load<boolean>('visited', false) ? 'title' : 'boot',
  )
  const [chapterId, setChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (screen !== 'boot') save('visited', true)
  }, [screen])

  const toTitle = useCallback(() => setScreen('title'), [])
  const toMap = useCallback(() => setScreen('map'), [])
  const toBoot = useCallback(() => setScreen('boot'), [])
  const toQuiz = useCallback(() => setScreen('quiz'), [])
  const openChapter = useCallback((id: string) => {
    setChapterId(id)
    setScreen('chapter')
  }, [])

  return (
    <ProgressProvider>
      <div className="crt">
        <MuteToggle />
        {screen === 'boot' && <BootScreen onDone={toTitle} />}
        {screen === 'title' && (
          <TitleScreen onStart={toMap} onClassCheck={toQuiz} onReplayBoot={toBoot} />
        )}
        {screen === 'map' && (
          <WorldMapScreen onOpenChapter={openChapter} onClassCheck={toQuiz} onBackToTitle={toTitle} />
        )}
        {screen === 'chapter' && chapterId && (
          <ChapterScreen chapterId={chapterId} onOpenChapter={openChapter} onBackToMap={toMap} />
        )}
        {screen === 'quiz' && <QuizScreen onOpenChapter={openChapter} onBackToMap={toMap} />}
      </div>
    </ProgressProvider>
  )
}
