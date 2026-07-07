import { useCallback, useEffect, useRef, useState } from 'react'
import { BootScreen } from './screens/BootScreen'
import { TitleScreen } from './screens/TitleScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { ChapterScreen } from './screens/ChapterScreen'
import { QuizScreen } from './screens/QuizScreen'
import { AchievementsScreen } from './screens/AchievementsScreen'
import { GateScreen } from './screens/GateScreen'
import { MuteToggle } from './components/MuteToggle'
import { EncounterModal } from './components/EncounterModal'
import { ProgressProvider, useProgress } from './state/ProgressContext'
import { AchievementProvider } from './state/AchievementContext'
import { config, isChapterLocked } from './config'
import { load, save } from './lib/storage'
import { sfx } from './lib/sound'
import type { Encounter } from './types/config'

type Screen = 'boot' | 'title' | 'map' | 'chapter' | 'quiz' | 'achievements' | 'gate'

/** RANDOM ENCOUNTER 등장 확률과 최소 간격 */
const ENCOUNTER_CHANCE = 0.12
const ENCOUNTER_COOLDOWN_MS = 90_000

export default function App() {
  return (
    <ProgressProvider>
      <AchievementProvider>
        <AppShell />
      </AchievementProvider>
    </ProgressProvider>
  )
}

/**
 * 화면 상태 머신 (라우터 대신 단일 페이지 상태 전환 —
 * 레트로 게임의 "장면 전환" 감성과 맞고 딥링크가 필요 없는 구조).
 * boot → title → map ⇄ (chapter | quiz | achievements | gate).
 * 잠긴 챕터로의 모든 진입(월드맵/NEXT/퀴즈 CTA)은 게이트를 거친다.
 */
function AppShell() {
  const { membershipUnlocked, rememberChapter } = useProgress()
  const [screen, setScreen] = useState<Screen>(() =>
    load<boolean>('visited', false) ? 'title' : 'boot',
  )
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null)
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
      if (isChapterLocked(id, membershipUnlocked)) {
        sfx.error()
        setPendingChapterId(id)
        setScreen('gate')
        return
      }
      setChapterId(id)
      setScreen('chapter')
      rememberChapter(id)
      rollEncounter()
    },
    [membershipUnlocked, rememberChapter, rollEncounter],
  )

  /** 게이트 해제 성공: 원래 가려던 챕터로 이동 */
  const onGateUnlocked = useCallback((id: string | null) => {
    setPendingChapterId(null)
    if (id) {
      setChapterId(id)
      setScreen('chapter')
    } else {
      setScreen('map')
    }
  }, [])

  return (
    <div className="crt">
      <MuteToggle />
      {screen === 'boot' && <BootScreen onDone={toTitle} />}
      {screen === 'title' && (
        <TitleScreen
          onStart={toMap}
          onContinue={openChapter}
          onClassCheck={toQuiz}
          onReplayBoot={toBoot}
        />
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
      {screen === 'gate' && (
        <GateScreen
          pendingChapterId={pendingChapterId}
          onUnlocked={onGateUnlocked}
          onBackToMap={toMap}
        />
      )}
      {encounter && <EncounterModal encounter={encounter} onClose={() => setEncounter(null)} />}
    </div>
  )
}
