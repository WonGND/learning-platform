# content-paid/ — 유료 챕터 본문 원본 (레포 밖 관리)

유료 챕터의 실제 본문은 `master.local.mjs` (gitignore 됨)에 두고,
`scripts/seed-paid-chapters.mjs` 로 Supabase `paid_chapters` 테이블에 시드한다.
레포에는 형식 예시(`master.example.mjs`)만 커밋한다. **본문을 커밋하지 마라.**
