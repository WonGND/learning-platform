import { supabase, tossClientKey } from './supabase'

/**
 * 토스페이먼츠 결제 흐름 (클라이언트 측).
 * 1) create-order Edge Function 으로 서버가 orderId·금액 생성 (금액은 서버가 결정)
 * 2) 토스 SDK requestPayment → 결제창 → 성공 시 successUrl 로 리다이렉트
 * 3) 리다이렉트 후 confirm-payment Edge Function 이 secret key 로 최종 확정
 *
 * 시크릿은 클라이언트에 없다. 여기서는 공개 clientKey 만 쓴다.
 */

interface TossPaymentsInstance {
  requestPayment: (
    method: string,
    opts: Record<string, unknown>,
  ) => Promise<void>
}
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance
  }
}

/** 토스 SDK 스크립트를 1회 주입 (CSP 에서 js.tosspayments.com 허용 필요) */
function loadTossSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) return resolve()
    const s = document.createElement('script')
    s.src = 'https://js.tosspayments.com/v1/payment'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('토스 SDK 로드 실패'))
    document.head.appendChild(s)
  })
}

export interface StartPaymentResult {
  error: string | null
}

/** 결제 시작 — 성공 시 토스 결제창으로 이동(리다이렉트)하므로 정상 흐름에선 반환하지 않는다 */
export async function startPayment(productId = 'master-pack'): Promise<StartPaymentResult> {
  if (!supabase || !tossClientKey) return { error: '결제가 아직 준비되지 않았습니다.' }

  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) return { error: '로그인이 필요합니다.' }

  // 1) 서버 주문 생성
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { productId },
  })
  if (error) return { error: '주문 생성에 실패했습니다.' }
  if (data?.error) {
    if (data.error === 'already_entitled') return { error: '이미 이용 권한이 있습니다.' }
    return { error: '주문을 만들 수 없습니다.' }
  }

  // 2) 토스 결제창 호출
  try {
    await loadTossSdk()
    const toss = window.TossPayments!(tossClientKey)
    const base = window.location.origin + window.location.pathname
    await toss.requestPayment('카드', {
      amount: data.amount,
      orderId: data.orderId,
      orderName: data.orderName,
      successUrl: `${base}#/pay/success`,
      failUrl: `${base}#/pay/fail`,
    })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : '결제창을 열지 못했습니다.' }
  }
}

/** 결제 성공 리다이렉트 후 서버 확정 — successUrl 쿼리(paymentKey·orderId·amount) 사용 */
export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: '백엔드가 설정되지 않았습니다.' }
  const { data, error } = await supabase.functions.invoke('confirm-payment', { body: params })
  if (error) return { error: '결제 확정에 실패했습니다.' }
  if (data?.error) return { error: '결제가 확인되지 않았습니다.' }
  return { error: null }
}
