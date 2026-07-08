// 입장 코드를 access_codes 테이블에 등록한다 (평문이 아니라 SHA-256 해시로 저장).
// service_role 키는 셸 환경변수로만 전달한다. 코드는 인자로 받는다.
//
// 사용법 (예: 코드 'password', 무제한에 가까운 한도):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/seed-access-code.mjs password 100000
//
// 두 번째 인자는 최대 사용 횟수(max_redemptions, 기본 1). 사용자별 1회만 적용된다.

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const code = process.argv[2]
const maxRedemptions = Number(process.argv[3] ?? 1)
const productId = process.argv[4] ?? 'master-pack'

if (!url || !serviceKey || !code) {
  console.error('사용법: SUPABASE_URL=.. SUPABASE_SERVICE_ROLE_KEY=.. node scripts/seed-access-code.mjs <code> [maxRedemptions] [productId]')
  process.exit(1)
}

const codeHash = createHash('sha256').update(code.trim()).digest('hex')
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const { error } = await supabase.from('access_codes').upsert(
  { code_hash: codeHash, product_id: productId, max_redemptions: maxRedemptions, active: true },
  { onConflict: 'code_hash' },
)
if (error) {
  console.error('코드 등록 실패:', error.message)
  process.exit(1)
}
// 평문 코드는 콘솔에 다시 출력하지 않는다.
console.log(`✓ 입장 코드 등록 완료 (product=${productId}, 한도=${maxRedemptions})`)
process.exit(0)
