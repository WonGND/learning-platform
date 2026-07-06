import { useCallback, useEffect, useRef, useState } from 'react'
import { BootScreen } from './screens/BootScreen'
import { TitleScreen } from './screens/TitleScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { ChapterScreen } from './screens/ChapterScreen'
import { QuizScreen } from './screens/QuizScreen'
import { AchievementsScreen } from './screens/AchievementsScreen'
import { MuteToggle } from './components/MuteToggle'
import { EncounterModal } from './components/EncounterModal'
import { ProgressProvider } from './state/ProgressContext'
import { AchievementProvider } from './state/AchievementContext'
import { config } from './config'
import { load, save } from './lib/storage'
import { sfx } from './lib/sound'
import type { Encounter } from './types/config'

type Screen = 'boot' | 'title' | 'map' | 'chapter' | 'quiz' | 'achievements'

/** RANDOM ENCOUNTER 등장 확률과 최소 간격 */
const ENCOUNTER_CHANCE = 0.12
const ENCOUNTER_COOLDOWN_MS = 90_000

/**
 * 화면 상태 머신 (라우터 대신 단일 페이지 상태 전환 —
 * 레트로 게임의 "장면 전환" 감성과 맞고 딥링크가 필요 없는 구조).
 * boot → title → map ⇄ (chapter | quiz | achievements). 재방문 시 부팅을 건너뛴다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    load<boolean>('visited', false) ? 'title' : 'boot',
  )
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const lastEncounterAt = useRef(0)

  useEffect(() => {
    if (screen !== 'boot') save('visited', true)
  }, [screen])

  const toTitle = useCallback(() => setScreen('title'), [])
  const toMap = useCallback(() => setScreen('map'), [])
  const toBoot = useCallback(() => setScreen('boot'), [])
  const toQuiz = useCallback(() => setScreen('quiz'), [])
  const toAchievements = useCallback(() => setScreen('achievements'), [])

  /** 챕터 진입 시 낮은 확률로 사이드 퀘스트(팁 카드) 팝업 */
  const rollEncounter = useCallback(() => {
    const list = config.encounters ?? []
    if (list.length === 0) return
    const now = Date.now()
    if (now - lastEncounterAt.current < ENCOUNTER_COOLDOWN_MS) return
    if (Math.random() >= ENCOUNTER_CHANCE) return
    lastEncounterAt.current = now
    setEncounter(list[Math.floor(Math.random() * list.length)])
    sfx.encounter()
  }, [])

  const openChapter = useCallback(
    (id: string) => {
      setChapterId(id)
      setScreen('chapter')
      rollEncounter()
    },
    [rollEncounter],
  )

  return (
    <ProgressProvider>
      <AchievementProvider>
        <div className="crt">
          <MuteToggle />
          {screen === 'boot' && <BootScreen onDone={toTitle} />}
          {screen === 'title' && (
            <TitleScreen onStart={toMap} onClassCheck={toQuiz} onReplayBoot={toBoot} />
          )}
          {screen === 'map' && (
            <WorldMapScreen
              onOpenChapter={openChapter}
              onClassCheck={toQuiz}
              onOpenAchievements={toAchievements}
              onBackToTitle={toTitle}
            />
          )}
          {screen === 'chapter' && chapterId && (
            <ChapterScreen chapterId={chapterId} onOpenChapter={openChapter} onBackToMap={toMap} />
          )}
          {screen === 'quiz' && <QuizScreen onOpenChapter={openChapter} onBackToMap={toMap} />}
          {screen === 'achievements' && <AchievementsScreen onBackToMap={toMap} />}
          {encounter && <EncounterModal encounter={encounter} onClose={() => setEncounter(null)} />}
        </div>
      </AchievementProvider>
    </ProgressProvider>
  )
}
