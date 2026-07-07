import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase 클라이언트 — anon key 만 사용한다 (RLS가 접근을 제한).
 * 시크릿(service_role, 토스 시크릿)은 절대 이 코드/번들에 넣지 않는다.
 *
 * env 미설정 시 null — 호출부는 backendReady 로 분기해
 * "결제 준비 중" 등으로 우아하게 강등해야 한다 (앱이 죽으면 안 된다).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

/** 백엔드(Supabase) 연결이 구성되어 있는가 */
export const backendReady = supabase !== null

/** 토스 클라이언트 키 (공개 가능 값 — 시크릿 아님) */
export const tossClientKey = (import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined) ?? null
