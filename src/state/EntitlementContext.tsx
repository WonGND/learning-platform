import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, backendReady } from '../lib/supabase'

/**
 * 서버 엔타이틀먼트 상태 — 유료화(모델 B)의 프론트 진실 공급원.
 *
 * - 세션(Supabase Auth)과 서버 판정(profiles.is_admin / entitlements)만 신뢰한다.
 * - hasPaidAccess 는 localStorage 로 조작할 수 없다 (서버 RLS 가 결정).
 * - backendReady=false(env 미설정)면 로그인 UI 대신 "결제 준비 중"으로 강등한다.
 */
interface EntitlementValue {
  /** 백엔드(Supabase) 구성 여부 */
  backendReady: boolean
  /** 로그인 세션 (없으면 null) */
  session: Session | null
  /** 유료 접근 권한 (관리자 or 유효 엔타이틀먼트) */
  hasPaidAccess: boolean
  /** 관리자 여부 */
  isAdmin: boolean
  /** 초기 세션·권한 로딩 중 */
  loading: boolean
  /** 매직링크 전송 */
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** 서버 권한 재조회 (코드 리딤·결제 성공 후 호출) */
  refreshEntitlements: () => Promise<void>
}

const EntitlementContext = createContext<EntitlementValue | null>(null)

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [entitled, setEntitled] = useState(false)
  const [loading, setLoading] = useState(backendReady)

  // 서버에서 권한 조회 — RLS 로 본인 행만 반환된다
  const loadEntitlements = useCallback(async (uid: string | undefined) => {
    if (!supabase || !uid) {
      setIsAdmin(false)
      setEntitled(false)
      return
    }
    const [{ data: profile }, { data: ents }] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', uid).maybeSingle(),
      supabase
        .from('entitlements')
        .select('expires_at')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    ])
    setIsAdmin(profile?.is_admin === true)
    setEntitled(Array.isArray(ents) && ents.length > 0)
  }, [])

  // 세션 구독
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadEntitlements(data.session?.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      void loadEntitlements(s?.user.id)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadEntitlements])

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: '백엔드가 설정되지 않았습니다.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setIsAdmin(false)
    setEntitled(false)
  }, [])

  const refreshEntitlements = useCallback(async () => {
    await loadEntitlements(session?.user.id)
  }, [loadEntitlements, session])

  const value = useMemo<EntitlementValue>(
    () => ({
      backendReady,
      session,
      hasPaidAccess: isAdmin || entitled,
      isAdmin,
      loading,
      signInWithEmail,
      signOut,
      refreshEntitlements,
    }),
    [session, isAdmin, entitled, loading, signInWithEmail, signOut, refreshEntitlements],
  )

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>
}

export function useEntitlement(): EntitlementValue {
  const ctx = useContext(EntitlementContext)
  if (!ctx) throw new Error('useEntitlement must be used within EntitlementProvider')
  return ctx
}
