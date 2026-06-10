-- ============================================================
-- スタッフ（worker）がタスクを追加・編集できるよう RLS を更新
-- ============================================================

-- task_insert: 管理者限定 → 同組織メンバー全員に変更
drop policy if exists "task_insert" on public.tasks;
create policy "task_insert" on public.tasks for insert
  with check (organization_id = public.my_organization_id());

-- task_update: 既存ポリシー（同組織メンバー全員）は変更なし
-- （001_initial_schema.sql で既に全員に許可済み）
