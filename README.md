# GENBA - 現場タスク・進捗管理

建設・工事現場向けタスク管理・作業日報アプリ

## 技術スタック

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **DB・認証・ストレージ**: Supabase
- **Styling**: Tailwind CSS v4
- **Deploy**: Vercel

---

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com にアクセス
2. 「Start your project」→ GitHubアカウントでサインイン
3. 「New project」をクリック
4. プロジェクト名: `genba`、パスワードを設定してCreate

### 2. データベースを初期化

1. Supabaseダッシュボード → **SQL Editor**
2. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けて実行

### 3. Storageバケットを作成

1. Supabaseダッシュボード → **Storage** → **New bucket**
2. Bucket名: `work-photos`
3. Public: **OFF**（非公開）

### 4. 環境変数を設定

1. Supabaseダッシュボード → **Settings** → **API**
2. `Project URL` と `anon public` キーをコピー
3. プロジェクトルートに `.env.local` を作成:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5. ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 にアクセス

### 6. 最初の管理者アカウントを作成

1. Supabaseダッシュボード → **Authentication** → **Users** → **Add user**
2. メールアドレスとパスワードを設定
3. **SQL Editor** で以下を実行:

```sql
-- 組織を作成
insert into public.organizations (name, slug)
values ('会社名', 'company-slug')
returning id;

-- 管理者profileを更新（上記のIDとAuthのuser IDを使用）
update public.profiles
set organization_id = '<<organization_id>>',
    role = 'admin',
    full_name = '管理者氏名'
where id = '<<user_id>>';
```

4. `/auth/login` でログイン

### 7. GitHubにpush → Vercelでデプロイ

```bash
git remote add origin https://github.com/unitedfutures/genba.git
git branch -M main
git push -u origin main
```

Vercel (https://vercel.com):
1. GitHubでサインイン → 「Add New Project」→ `genba` を選択
2. Environment Variables に SUPABASE_URL と ANON_KEY を追加
3. Deploy

---

## 画面一覧

| 画面 | URL | 対象 |
|------|-----|------|
| ログイン | /auth/login | 全員 |
| 招待受け入れ | /auth/invite/[token] | 招待者 |
| ダッシュボード | /dashboard | 管理者 |
| スタッフ管理 | /staff | 管理者 |
| 現場管理 | /sites | 管理者 |
| タスク管理 | /tasks | 管理者 |
| 日報管理 | /reports | 管理者 |
| マイページ | /my | 作業者 |
| 打刻 | /my/clock | 作業者 |
| 自分の日報 | /my/reports | 作業者 |
| プロフィール | /profile | 全員 |
