-- ============================================================
-- 0001_init.sql — 모델 B 유료화 기반 스키마 (Supabase)
-- 원칙: 모든 테이블 RLS 활성화 / 쓰기는 service_role(Edge Function)만 /
--       사용자는 자기 데이터만 읽기 / 유료 본문은 권한자만 SELECT
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles — 가입자 프로필 + 관리자 플래그
-- is_admin 은 클라이언트가 절대 쓸 수 없다 (쓰기 정책 없음).
-- 설정 방법: Supabase 대시보드 SQL Editor에서만 (supabase/README.md 참고)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);
-- insert/update/delete 정책 없음 → 클라이언트 쓰기 전면 차단

-- 가입 시 프로필 자동 생성
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- products — 판매 상품 (가격의 유일한 진실 공급원)
-- ------------------------------------------------------------
create table public.products (
  id text primary key,
  name text not null,
  price_krw integer not null check (price_krw >= 0),
  active boolean not null default true
);

alter table public.products enable row level security;

create policy "products_select_active"
  on public.products for select
  using (active);

-- 시드: 마스터 팩 (⚠ 가격은 플레이스홀더 — 판매가 확정 후 UPDATE 할 것)
insert into public.products (id, name, price_krw)
values ('master-pack', '마스터의 탑 전권 해제', 49000);

-- ------------------------------------------------------------
-- entitlements — 권한 원장 (쓰기 = 서버만)
-- ------------------------------------------------------------
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id),
  source text not null check (source in ('admin', 'code', 'payment')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, product_id)
);

alter table public.entitlements enable row level security;

create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- access_codes — 입장 코드 (평문 저장 금지: SHA-256 해시만)
-- 클라이언트 정책 전무 → anon/authenticated 는 조회조차 불가
-- ------------------------------------------------------------
create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  product_id text not null references public.products (id),
  max_redemptions integer not null default 1 check (max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.access_codes enable row level security;

-- ------------------------------------------------------------
-- code_redemptions — 사용자별 중복 사용 방지
-- ------------------------------------------------------------
create table public.code_redemptions (
  code_id uuid not null references public.access_codes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code_id, user_id)
);

alter table public.code_redemptions enable row level security;

create policy "redemptions_select_own"
  on public.code_redemptions for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- orders — 결제 주문 (id = 토스 orderId, 서버가 생성)
-- toss_payment_key UNIQUE = 중복 콜백 멱등 방어선
-- ------------------------------------------------------------
create table public.orders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id),
  amount_krw integer not null check (amount_krw > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  toss_payment_key text unique,
  approved_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- paid_chapters — 유료 본문 (권한자만 SELECT)
-- ------------------------------------------------------------
create table public.paid_chapters (
  id text primary key,
  title text not null,
  summary text not null default '',
  body text not null,
  sort integer not null default 0
);

alter table public.paid_chapters enable row level security;

-- ------------------------------------------------------------
-- 판정 헬퍼 — 인자 없음(내부에서 auth.uid() 사용):
-- 임의 uid 를 넣어 타인의 권한 여부를 조회하는 정보 누출을 차단
-- ------------------------------------------------------------
create function public.has_paid_access()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
      or exists (select 1 from entitlements e
                 where e.user_id = auth.uid()
                   and (e.expires_at is null or e.expires_at > now()));
$$;

grant execute on function public.has_paid_access() to authenticated;

create policy "paid_chapters_select_entitled"
  on public.paid_chapters for select
  to authenticated
  using (public.has_paid_access());

-- ------------------------------------------------------------
-- redeem_code — 원자적 코드 리딤 (row lock 으로 한도 경쟁 조건 방지)
-- service_role 전용: Edge Function 만 호출한다
-- 반환: 'ok' | 'invalid' | 'expired' | 'exhausted' | 'already_redeemed'
-- ------------------------------------------------------------
create function public.redeem_code(p_code_hash text, p_user uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code access_codes%rowtype;
begin
  select * into v_code
    from access_codes
   where code_hash = p_code_hash
   for update;

  if not found or not v_code.active then
    return 'invalid';
  end if;
  if v_code.expires_at is not null and v_code.expires_at <= now() then
    return 'expired';
  end if;
  if exists (select 1 from code_redemptions
              where code_id = v_code.id and user_id = p_user) then
    return 'already_redeemed';
  end if;
  if v_code.redeemed_count >= v_code.max_redemptions then
    return 'exhausted';
  end if;

  insert into code_redemptions (code_id, user_id) values (v_code.id, p_user);
  update access_codes
     set redeemed_count = redeemed_count + 1
   where id = v_code.id;
  insert into entitlements (user_id, product_id, source)
  values (p_user, v_code.product_id, 'code')
  on conflict (user_id, product_id) do nothing;

  return 'ok';
end $$;

-- 클라이언트가 RPC 로 직접 호출하지 못하게 실행 권한 회수 (service_role 만)
revoke execute on function public.redeem_code(text, uuid) from public;
revoke execute on function public.redeem_code(text, uuid) from anon;
revoke execute on function public.redeem_code(text, uuid) from authenticated;
