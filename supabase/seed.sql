-- ============================================================
-- シードデータ: 最初の組織と管理者アカウントを作成する例
-- Supabase Auth UIで管理者ユーザーを作成後、このSQLを実行してください
-- ============================================================

-- 1. 組織を作成
insert into public.organizations (name, slug, plan)
values ('株式会社サンプル', 'sample-company', 'free');

-- 2. 作成した組織のIDを確認して、管理者ユーザーのprofileを更新
-- update public.profiles
-- set organization_id = '<organization_id>',
--     role = 'admin'
-- where id = '<user_id>';
