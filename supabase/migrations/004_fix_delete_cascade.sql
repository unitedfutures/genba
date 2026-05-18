-- ユーザー削除時の外部キー制約を修正
-- profiles を参照しているテーブルに ON DELETE SET NULL / CASCADE を追加

-- tasks: assigned_to, created_by → SET NULL（タスク自体は残す）
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey,
  ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey,
  ADD CONSTRAINT tasks_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- sites: created_by → SET NULL（現場自体は残す）
ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_created_by_fkey,
  ADD CONSTRAINT sites_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- photos: uploaded_by → SET NULL（写真自体は残す）
ALTER TABLE public.photos
  DROP CONSTRAINT IF EXISTS photos_uploaded_by_fkey,
  ADD CONSTRAINT photos_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- comments: author_id → CASCADE（投稿者削除時はコメントも削除）
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey,
  ADD CONSTRAINT comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- invitations: invited_by → SET NULL（招待レコード自体は残す）
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey,
  ADD CONSTRAINT invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
