-- 실데이터 모드용 테이블: 리뷰 원본과 대화 기록

create table if not exists public.reviews (
  id text primary key,
  rating integer not null,
  title text not null default '',
  content text not null,
  author text not null default '',
  date date,
  helpful_votes integer not null default 0,
  verified_purchase boolean not null default false
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  chat_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at);

alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- 인증 없는 실습 앱을 위한 최소 권한: 서버가 공개 키(anon)로 접근한다.
create policy "reviews_select_anon" on public.reviews
  for select to anon using (true);
create policy "reviews_insert_anon" on public.reviews
  for insert to anon with check (true);
create policy "reviews_update_anon" on public.reviews
  for update to anon using (true) with check (true);

create policy "messages_insert_anon" on public.messages
  for insert to anon with check (true);
