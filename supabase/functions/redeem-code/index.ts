// 입장 코드 리딤 — 로그인 사용자만. 코드를 SHA-256 해시로 변환해
// redeem_code() RPC(원자적, service_role 전용)를 호출한다.
// 반환: { ok } 또는 { error: 'invalid'|'expired'|'exhausted'|'already_redeemed' }
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // 1) 요청자 인증 — anon 클라이언트 + 사용자 JWT 로 본인 확인
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401)

  let code = ''
  try {
    const body = await req.json()
    code = String(body.code ?? '')
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  const normalized = code.trim()
  if (!normalized) return json({ error: 'invalid' }, 200)

  // 2) 해시 후 service_role 로 원자적 리딤
  const codeHash = await sha256Hex(normalized)
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: result, error } = await admin.rpc('redeem_code', {
    p_code_hash: codeHash,
    p_user: userData.user.id,
  })
  if (error) return json({ error: 'server_error' }, 500)
  if (result === 'ok') return json({ ok: true })
  return json({ error: result }, 200) // invalid|expired|exhausted|already_redeemed
})
