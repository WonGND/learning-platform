# Supabase 설정 가이드 (모델 B 유료화)

## 1. 프로젝트 생성 & 마이그레이션

1. https://supabase.com 에서 새 프로젝트 생성 (리전: Seoul 권장)
2. 마이그레이션 적용 — 둘 중 하나:
   - **CLI**: `supabase link --project-ref <ref>` → `supabase db push`
   - **대시보드**: SQL Editor 에 `migrations/0001_init.sql` 내용을 붙여넣고 실행
3. 적용 확인: Table Editor 에 profiles / products / entitlements / access_codes /
   code_redemptions / orders / paid_chapters 7개 테이블 + 전부 RLS enabled 표시

## 2. Auth (이메일 매직링크)

1. Authentication → Providers → **Email** 활성화 (비밀번호 없이 매직링크만 사용)
2. Authentication → URL Configuration:
   - Site URL: 배포 도메인 (개발 중엔 http://localhost:5173)
   - Redirect URLs 에 `http://localhost:5173`, 배포 도메인 추가

## 3. 관리자(오너) 지정 — 서버에서만 가능

본인 계정으로 앱에서 1회 로그인(가입) 후, **SQL Editor** 에서:

```sql
update public.profiles set is_admin = true
 where id = (select id from auth.users where email = '나의이메일@example.com');
```

클라이언트에는 profiles 쓰기 정책이 없으므로 이 플래그는 API로 변경 불가능하다.

## 4. 클라이언트 env

`.env.example` 을 `.env` 로 복사하고 값 입력 (`.env` 는 gitignore 됨):

```
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_TOSS_CLIENT_KEY
```

env 가 없으면 앱은 죽지 않고 게이트가 "결제 준비 중" 모드로 동작한다.

## 5. Edge Function secrets (Phase 3~4 에서 사용)

```bash
supabase secrets set TOSS_SECRET_KEY=test_sk_XXXX   # 개발은 테스트 키
supabase secrets set ALLOWED_ORIGIN=https://내도메인
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 는 플랫폼이 함수 런타임에 자동 주입한다.

## 6. 검증된 보안 속성 (로컬 Postgres 16 침투 테스트 17항목 통과)

- anon / 비권한 사용자: `paid_chapters` `access_codes` SELECT = 0행
- 사용자는 자기 entitlements/orders/redemptions 만 조회 가능
- 클라이언트의 entitlement 삽입·is_admin 셀프 승격 차단
- `redeem_code()` 는 authenticated 실행 거부(service_role 전용), 원자적 처리로
  중복 사용·한도 초과·만료 코드 방어

## 7. 유료 본문 시드 (Phase 2)

유료 챕터 본문은 레포에 없다. gitignore 된 `content-paid/master.local.mjs`(백업 필수)에서 읽어 DB에 올린다:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node scripts/seed-paid-chapters.mjs
```

## 8. Edge Functions 배포 (Phase 3~4)

```bash
supabase functions deploy redeem-code
supabase functions deploy create-order
supabase functions deploy confirm-payment
supabase secrets set TOSS_SECRET_KEY=test_sk_XXXX   # 개발은 테스트 키
supabase secrets set ALLOWED_ORIGIN=https://내도메인
# SUPABASE_ANON_KEY 도 함수에서 사용자 JWT 검증에 쓰므로 secrets 에 설정:
supabase secrets set SUPABASE_ANON_KEY=<anon key>
```

## 9. 입장 코드 등록 (서버, 해시 저장)

입장 코드는 평문이 아니라 SHA-256 해시로 `access_codes` 에 저장된다. 예: 코드 `password`:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/seed-access-code.mjs password 100000
```

(두 번째 인자는 총 사용 한도. 사용자별로는 1회만 리딤된다.)

## 10. 결제 흐름 (토스페이먼츠)

1. 클라이언트: 게이트에서 로그인 → "결제하고 전권 해제"
2. `create-order` 가 서버에서 orderId·금액 생성 (가격은 products 가 결정)
3. 토스 SDK `requestPayment` → 결제창 → 성공 시 `#/pay/success` 로 리다이렉트
4. `confirm-payment` 가 **secret key 로 토스 confirm + 금액 대조 + 멱등** 후 엔타이틀먼트 부여
5. 클라이언트의 "결제됨" 신호는 신뢰하지 않는다 — 서버 confirm 성공만 인정

## 11. 라이브 전환 체크리스트

- [ ] 토스페이먼츠 가맹 심사 통과 후 라이브 키 발급
- [ ] `VITE_TOSS_CLIENT_KEY` 를 `live_ck_...` 로, `TOSS_SECRET_KEY` 를 `live_sk_...` 로 교체
- [ ] `products.price_krw` 를 실제 판매가로 설정
- [ ] `ALLOWED_ORIGIN` 을 운영 도메인으로 고정
- [ ] 법적 페이지(이용약관·환불정책·개인정보처리방침) 게시 + 사업자 정보 표기
