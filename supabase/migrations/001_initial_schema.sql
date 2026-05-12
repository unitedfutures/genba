-- ============================================================
-- GENBA - 初期スキーマ
-- ============================================================

-- organizations (テナント)
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  plan        text not null default 'free' check (plan in ('free', 'paid')),
  created_at  timestamptz not null default now()
);

-- profiles (auth.usersと1:1)
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organization_id  uuid references public.organizations(id) on delete cascade,
  full_name        text not null,
  role             text not null default 'worker' check (role in ('admin', 'worker')),
  phone            text,
  avatar_url       text,
  created_at       timestamptz not null default now()
);

-- invitations (招待)
create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  email            text not null,
  role             text not null default 'worker' check (role in ('admin', 'worker')),
  token            text unique not null,
  invited_by       uuid references public.profiles(id),
  accepted_at      timestamptz,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now()
);

-- sites (現場)
create table public.sites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  address          text,
  status           text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

-- tasks (タスク)
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  site_id          uuid not null references public.sites(id) on delete cascade,
  title            text not null,
  description      text,
  assigned_to      uuid references public.profiles(id),
  created_by       uuid references public.profiles(id),
  status           text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date         date,
  created_at       timestamptz not null default now()
);

-- work_logs (日報・打刻)
create table public.work_logs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  worker_id           uuid not null references public.profiles(id) on delete cascade,
  site_id             uuid not null references public.sites(id),
  task_id             uuid references public.tasks(id),
  work_date           date not null,
  clock_in_at         timestamptz,
  clock_in_lat        double precision,
  clock_in_lng        double precision,
  clock_in_address    text,
  clock_out_at        timestamptz,
  clock_out_lat       double precision,
  clock_out_lng       double precision,
  clock_out_address   text,
  work_description    text,
  worker_comment      text,
  status              text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at          timestamptz not null default now()
);

-- photos (写真)
create table public.photos (
  id               uuid primary key default gen_random_uuid(),
  work_log_id      uuid not null references public.work_logs(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  uploaded_by      uuid references public.profiles(id),
  storage_path     text not null,
  photo_type       text not null check (photo_type in ('before', 'after')),
  caption          text,
  created_at       timestamptz not null default now()
);

-- comments (コメント)
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  work_log_id  uuid not null references public.work_logs(id) on delete cascade,
  author_id    uuid not null references public.profiles(id),
  content      text not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- インデックス
-- ============================================================
create index on public.profiles (organization_id);
create index on public.invitations (organization_id);
create index on public.invitations (token);
create index on public.sites (organization_id);
create index on public.tasks (organization_id);
create index on public.tasks (assigned_to);
create index on public.work_logs (organization_id);
create index on public.work_logs (worker_id);
create index on public.work_logs (work_date);
create index on public.photos (work_log_id);
create index on public.comments (work_log_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.invitations   enable row level security;
alter table public.sites         enable row level security;
alter table public.tasks         enable row level security;
alter table public.work_logs     enable row level security;
alter table public.photos        enable row level security;
alter table public.comments      enable row level security;

-- Helper: 自分のorganization_idを取得
create or replace function public.my_organization_id()
returns uuid language sql stable security definer as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- Helper: 自分のroleを取得
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- organizations: 自分の組織のみ閲覧
create policy "org_select" on public.organizations for select
  using (id = public.my_organization_id());

-- profiles: 同じ組織のメンバーは閲覧OK、更新は自分のみ
create policy "profile_select" on public.profiles for select
  using (organization_id = public.my_organization_id());
create policy "profile_insert" on public.profiles for insert
  with check (id = auth.uid());
create policy "profile_update" on public.profiles for update
  using (id = auth.uid());

-- invitations: 同組織の管理者がCRUD
create policy "invitation_select" on public.invitations for select
  using (organization_id = public.my_organization_id());
create policy "invitation_insert" on public.invitations for insert
  with check (organization_id = public.my_organization_id() and public.my_role() = 'admin');
create policy "invitation_delete" on public.invitations for delete
  using (organization_id = public.my_organization_id() and public.my_role() = 'admin');

-- sites: 同組織メンバーは閲覧、管理者はCRUD
create policy "site_select" on public.sites for select
  using (organization_id = public.my_organization_id());
create policy "site_insert" on public.sites for insert
  with check (organization_id = public.my_organization_id() and public.my_role() = 'admin');
create policy "site_update" on public.sites for update
  using (organization_id = public.my_organization_id() and public.my_role() = 'admin');

-- tasks: 同組織メンバーは閲覧、管理者はCRUD
create policy "task_select" on public.tasks for select
  using (organization_id = public.my_organization_id());
create policy "task_insert" on public.tasks for insert
  with check (organization_id = public.my_organization_id() and public.my_role() = 'admin');
create policy "task_update" on public.tasks for update
  using (organization_id = public.my_organization_id());

-- work_logs: 管理者は全件、作業者は自分のみ
create policy "worklog_select" on public.work_logs for select
  using (
    organization_id = public.my_organization_id()
    and (public.my_role() = 'admin' or worker_id = auth.uid())
  );
create policy "worklog_insert" on public.work_logs for insert
  with check (organization_id = public.my_organization_id() and worker_id = auth.uid());
create policy "worklog_update" on public.work_logs for update
  using (organization_id = public.my_organization_id() and worker_id = auth.uid());

-- photos: worklog同様
create policy "photo_select" on public.photos for select
  using (organization_id = public.my_organization_id());
create policy "photo_insert" on public.photos for insert
  with check (organization_id = public.my_organization_id() and uploaded_by = auth.uid());
create policy "photo_delete" on public.photos for delete
  using (organization_id = public.my_organization_id() and uploaded_by = auth.uid());

-- comments: 同組織メンバーは閲覧・投稿
create policy "comment_select" on public.comments for select
  using (exists(
    select 1 from public.work_logs wl
    where wl.id = work_log_id
    and wl.organization_id = public.my_organization_id()
  ));
create policy "comment_insert" on public.comments for insert
  with check (author_id = auth.uid());

-- ============================================================
-- Auth trigger: 新規ユーザー登録時にprofileを自動作成
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_org_id   uuid;
  v_role     text;
  v_inv_token text;
begin
  v_org_id    := (new.raw_user_meta_data->>'organization_id')::uuid;
  v_role      := coalesce(new.raw_user_meta_data->>'role', 'worker');
  v_inv_token := new.raw_user_meta_data->>'invitation_token';

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  );

  -- 招待を承認済みにする
  if v_inv_token is not null then
    update public.invitations
    set accepted_at = now()
    where token = v_inv_token;
  end if;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Storage bucket (Supabaseダッシュボードで作成してください)
-- bucket name: work-photos
-- public: false
-- ============================================================

-- Storage policies (work-photos バケット)
-- ダッシュボードのSQL Editorで実行してください
create policy "auth_users_can_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'work-photos');

create policy "auth_users_can_read"
on storage.objects for select
to authenticated
using (bucket_id = 'work-photos');

create policy "auth_users_can_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'work-photos');
