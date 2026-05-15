-- ============================================================
-- RLS 修正マイグレーション
-- ============================================================

-- ① organizations: 管理者のみ自社情報を更新可能
create policy "org_update" on public.organizations for update
  using (id = public.my_organization_id() and public.my_role() = 'admin');

-- ② sites: 管理者のみ削除可能
create policy "site_delete" on public.sites for delete
  using (organization_id = public.my_organization_id() and public.my_role() = 'admin');

-- ③ tasks: 管理者のみ削除可能
create policy "task_delete" on public.tasks for delete
  using (organization_id = public.my_organization_id() and public.my_role() = 'admin');

-- ④ comments: 自社の work_log に対してのみ投稿可能
drop policy if exists "comment_insert" on public.comments;
create policy "comment_insert" on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.work_logs wl
      where wl.id = work_log_id
        and wl.organization_id = public.my_organization_id()
    )
  );

-- ⑤ storage: 写真アクセスを自社フォルダ（{organization_id}/...）に限定
--    パス構造: {organization_id}/{work_log_id}/{filename}
drop policy if exists "auth_users_can_upload" on storage.objects;
drop policy if exists "auth_users_can_read"   on storage.objects;
drop policy if exists "auth_users_can_delete" on storage.objects;

create policy "org_scoped_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = public.my_organization_id()::text
  );

create policy "org_scoped_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = public.my_organization_id()::text
  );

create policy "org_scoped_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = public.my_organization_id()::text
  );
