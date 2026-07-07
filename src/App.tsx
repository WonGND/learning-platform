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
import { ConsentBanner } from './components/ConsentBanner'
import { ProgressProvider, useProgress } from './state/ProgressContext'
import { AchievementProvider } from './state/AchievementContext'
import { config, isChapterLocked, findChapterEntry } from './config'
import { useHashRoute } from './hooks/useHashRoute'
import { load, save } from './lib/storage'
import { sfx } from './lib/sound'
import type { Encounter } from './types/config'

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
 * 해시 라우트가 화면의 단일 진실 공급원이다 (딥링크·새로고침 복원·뒤로가기 지원).
 * 부팅 연출은 라우트 밖의 오버레이 상태 — 첫 방문 시에만 자동 재생된다.
 * 잠긴 챕터로의 모든 진입(딥링크 포함)은 게이트로 리다이렉트된다.
 */
function AppShell() {
  const { membershipUnlocked, rememberChapter } = useProgress()
  const [route, navigate] = useHashRoute()
  const [booting, setBooting] = useState<boolean>(() => !load<boolean>('visited', false))
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const lastEncounterAt = useRef(0)

  const toMap = useCallback(() => navigate({ screen: 'map' }), [navigate])
  const toTitle = useCallback(() => navigate({ screen: 'title' }), [navigate])
  const toQuiz = useCallback(() => navigate({ screen: 'quiz' }), [navigate])
  const toAchievements = useCallback(() => navigate({ screen: 'achievements' }), [navigate])

  const openChapter = useCallback(
    (id: string) => {
      if (isChapterLocked(id, membershipUnlocked)) {
        sfx.error()
        navigate({ screen: 'gate', pendingChapterId: id })
        return
      }
      navigate({ screen: 'chapter', chapterId: id })
    },
    [membershipUnlocked, navigate],
  )

  // 딥링크로 잠긴 챕터에 직접 진입한 경우에도 게이트로
  useEffect(() => {
    if (route.screen === 'chapter' && isChapterLocked(route.chapterId, membershipUnlocked)) {
      navigate({ screen: 'gate', pendingChapterId: route.chapterId })
    }
  }, [route, membershipUnlocked, navigate])

  // 챕터 진입 부수효과: 이어보기 기억 + 낮은 확률 인카운터
  useEffect(() => {
    if (route.screen !== 'chapter') return
    if (isChapterLocked(route.chapterId, membershipUnlocked)) return
    rememberChapter(route.chapterId)
    const list = config.encounters ?? []
    if (list.length === 0) return
    const now = Date.now()
    if (now - lastEncounterAt.current < ENCOUNTER_COOLDOWN_MS) return
    if (Math.random() >= ENCOUNTER_CHANCE) return
    lastEncounterAt.current = now
    setEncounter(list[Math.floor(Math.random() * list.length)])
    sfx.encounter()
  }, [route, membershipUnlocked, rememberChapter])

  // 라우트별 문서 제목 (챕터별 메타)
  useEffect(() => {
    const brand = config.brand.title
    let title = brand
    if (route.screen === 'chapter') {
      const entry = findChapterEntry(route.chapterId)
      if (entry) title = `${entry.chapter.title} — ${brand}`
    } else if (route.screen === 'map') title = `월드맵 — ${brand}`
    else if (route.screen === 'quiz') title = `CLASS CHECK — ${brand}`
    else if (route.screen === 'achievements') title = `TROPHY ROOM — ${brand}`
    document.title = title
  }, [route])

  const onGateUnlocked = useCallback(
    (id: string | null) => {
      if (id) navigate({ screen: 'chapter', chapterId: id })
      else navigate({ screen: 'map' })
    },
    [navigate],
  )

  if (booting) {
    return (
      <div className="crt">
        <MuteToggle />
        <BootScreen
          onDone={() => {
            save('visited', true)
            setBooting(false)
          }}
        />
      </div>
    )
  }

  const chapterLocked =
    route.screen === 'chapter' && isChapterLocked(route.chapterId, membershipUnlocked)

  return (
    <div className="crt">
      <MuteToggle />
      {route.screen === 'title' && (
        <TitleScreen
          onStart={toMap}
          onContinue={openChapter}
          onClassCheck={toQuiz}
          onReplayBoot={() => setBooting(true)}
        />
      )}
      {route.screen === 'map' && (
        <WorldMapScreen
          onOpenChapter={openChapter}
          onClassCheck={toQuiz}
          onOpenAchievements={toAchievements}
          onBackToTitle={toTitle}
        />
      )}
      {route.screen === 'chapter' && !chapterLocked && (
        <ChapterScreen
          chapterId={route.chapterId}
          onOpenChapter={openChapter}
          onBackToMap={toMap}
        />
      )}
      {route.screen === 'quiz' && <QuizScreen onOpenChapter={openChapter} onBackToMap={toMap} />}
      {route.screen === 'achievements' && <AchievementsScreen onBackToMap={toMap} />}
      {route.screen === 'gate' && (
        <GateScreen
          pendingChapterId={route.pendingChapterId}
          onUnlocked={onGateUnlocked}
          onBackToMap={toMap}
        />
      )}
      {encounter && <EncounterModal encounter={encounter} onClose={() => setEncounter(null)} />}
      <ConsentBanner />
    </div>
  )
}
