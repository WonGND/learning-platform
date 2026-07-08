import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; body: string }
  | { status: 'denied' } // 권한 없음 (RLS 가 0행 반환) 또는 미로그인
  | { status: 'error'; message: string }

/**
 * 유료 챕터 본문 온디맨드 fetch.
 * paid_chapters 는 RLS 로 보호되어 권한자에게만 body 를 반환한다.
 * 비로그인·비권한 사용자는 0행을 받아 'denied' 로 처리된다 (본문 노출 없음).
 */
export function usePaidChapterBody(chapterId: string, enabled: boolean): State {
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' })
      return
    }
    if (!supabase) {
      setState({ status: 'error', message: '백엔드가 설정되지 않았습니다.' })
      return
    }
    let active = true
    setState({ status: 'loading' })
    supabase
      .from('paid_chapters')
      .select('body')
      .eq('id', chapterId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setState({ status: 'error', message: error.message })
        } else if (!data) {
          setState({ status: 'denied' })
        } else {
          setState({ status: 'ready', body: data.body })
        }
      })
    return () => {
      active = false
    }
  }, [chapterId, enabled])

  return state
}
