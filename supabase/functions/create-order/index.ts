// 주문 생성 — 로그인 사용자만. 가격은 서버가 products 에서 조회한다
// (클라이언트가 보낸 금액은 신뢰하지 않는다). orders 를 pending 으로 기록하고
// { orderId, amount, orderName } 을 반환한다.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401)

  let productId = 'master-pack'
  try {
    const body = await req.json()
    if (body.productId) productId = String(body.productId)
  } catch {
    // 기본 상품 사용
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // 가격은 서버에서만 — products 테이블이 진실 공급원
  const { data: product, error: prodErr } = await admin
    .from('products')
    .select('id, name, price_krw, active')
    .eq('id', productId)
    .maybeSingle()
  if (prodErr || !product || !product.active) return json({ error: 'invalid_product' }, 400)

  // 이미 권한이 있으면 결제 불필요
  const { data: existing } = await admin
    .from('entitlements')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('product_id', productId)
    .maybeSingle()
  if (existing) return json({ error: 'already_entitled' }, 409)

  const orderId = `order_${crypto.randomUUID()}`
  const { error: insErr } = await admin.from('orders').insert({
    id: orderId,
    user_id: userData.user.id,
    product_id: productId,
    amount_krw: product.price_krw,
    status: 'pending',
  })
  if (insErr) return json({ error: 'server_error' }, 500)

  return json({ orderId, amount: product.price_krw, orderName: product.name })
})
