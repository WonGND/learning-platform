// 유료 챕터 본문을 Supabase paid_chapters 테이블에 시드한다.
// service_role 키는 셸 환경변수로만 전달 (레포·번들에 절대 포함 금지).
//
// 사용법:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/seed-paid-chapters.mjs
//
// 본문 원본은 gitignore 된 content-paid/master.local.mjs 에서 읽는다.

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const localPath = resolve(here, '../content-paid/master.local.mjs')

let paidChapters
try {
  ;({ paidChapters } = await import(localPath))
} catch {
  console.error(`유료 본문 원본을 찾을 수 없습니다: ${localPath}`)
  console.error('content-paid/master.example.mjs 를 참고해 master.local.mjs 를 작성하세요.')
  process.exit(1)
}

if (!Array.isArray(paidChapters) || paidChapters.length === 0) {
  console.error('paidChapters 가 비어 있습니다.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const rows = paidChapters.map((c) => ({
  id: c.id,
  title: c.title,
  summary: c.summary ?? '',
  body: c.body,
  sort: c.sort ?? 0,
}))

const { error } = await supabase.from('paid_chapters').upsert(rows, { onConflict: 'id' })
if (error) {
  console.error('시드 실패:', error.message)
  process.exit(1)
}

console.log(`✓ paid_chapters 시드 완료: ${rows.length}개 (${rows.map((r) => r.id).join(', ')})`)
// 본문은 콘솔에 출력하지 않는다.
process.exit(0)
