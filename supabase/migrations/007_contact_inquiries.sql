-- お問い合わせテーブル
create table public.contact_inquiries (
  id          uuid primary key default gen_random_uuid(),
  company     text,
  name        text not null,
  email       text not null,
  phone       text,
  type        text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- RLS は不要（公開フォームからの書き込み専用、読み取りは管理者がダッシュボードから直接確認）
-- service_role キー（admin client）からのみ INSERT を許可する
alter table public.contact_inquiries enable row level security;
