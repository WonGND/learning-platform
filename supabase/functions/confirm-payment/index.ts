// 결제 확정 — 토스 secret key 로 서버 confirm 후에만 엔타이틀먼트를 부여한다.
// 검증: 주문 소유자 == 요청자 / DB 금액 == 클라이언트 amount == 토스 응답 금액 /
//       멱등(이미 paid + 동일 paymentKey 면 성공 재응답, 다른 키면 거부).
// 클라이언트의 "결제됨" 신호는 신뢰하지 않는다.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const tossSecret = Deno.env.get('TOSS_SECRET_KEY')!

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401)

  let paymentKey = '', orderId = '', amount = 0
  try {
    const body = await req.json()
    paymentKey = String(body.paymentKey ?? '')
    orderId = String(body.orderId ?? '')
    amount = Number(body.amount ?? 0)
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  if (!paymentKey || !orderId || !(amount > 0)) return json({ error: 'bad_request' }, 400)

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // 1) 주문 조회 + 소유자·금액 검증
  const { data: order, error: ordErr } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (ordErr || !order) return json({ error: 'order_not_found' }, 404)
  if (order.user_id !== userData.user.id) return json({ error: 'forbidden' }, 403)
  if (order.amount_krw !== amount) return json({ error: 'amount_mismatch' }, 400)

  // 2) 멱등 — 이미 처리된 주문
  if (order.status === 'paid') {
    if (order.toss_payment_key === paymentKey) return json({ ok: true, idempotent: true })
    return json({ error: 'order_already_paid' }, 409)
  }
  if (order.status === 'failed') return json({ error: 'order_failed' }, 409)

  // 3) 토스 서버 confirm (secret key)
  const basic = btoa(`${tossSecret}:`)
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })
  const tossData = await tossRes.json()

  if (!tossRes.ok || tossData.status !== 'DONE' || tossData.totalAmount !== order.amount_krw) {
    await admin
      .from('orders')
      .update({ status: 'failed', raw: tossData })
      .eq('id', orderId)
      .eq('status', 'pending')
    return json({ error: 'payment_not_confirmed', detail: tossData?.message ?? null }, 402)
  }

  // 4) 성공 — 주문 확정 + 엔타이틀먼트 부여 (멱등: 조건부 update)
  const { data: updated, error: updErr } = await admin
    .from('orders')
    .update({
      status: 'paid',
      toss_payment_key: paymentKey,
      approved_at: new Date().toISOString(),
      raw: tossData,
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')
  if (updErr) return json({ error: 'server_error' }, 500)
  if (!updated || updated.length === 0) {
    // 경쟁 콜백이 먼저 처리 — 이미 paid 상태로 간주
    return json({ ok: true, idempotent: true })
  }

  await admin
    .from('entitlements')
    .upsert(
      { user_id: order.user_id, product_id: order.product_id, source: 'payment' },
      { onConflict: 'user_id,product_id' },
    )

  return json({ ok: true })
})
