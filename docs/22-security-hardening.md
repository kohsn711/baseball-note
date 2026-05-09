# 22 セキュリティリスク対応

## 概要

コードベース全体のセキュリティ調査で見つかった、Supabase RLS・認可・依存関係のリスクを整理し、公開前に必要な防御を強化する。

## 対応できていること

### 認証・セッション

- [x] Supabase Authのセッション確認は `getClaims()` を使っており、Server Component / Server Action / Proxyで認証済みユーザーを確認している
- [x] `/login`、`/setup`、`/admin` など主要導線で未ログイン・未設定・ロール不一致のリダイレクトを実装している
- [x] Server Action側でも、学生・監督・保護者・管理者のロール確認を実施している

### 秘密情報・環境変数

- [x] `.env.local` は `.gitignore` 対象で、git管理されていない
- [x] `SUPABASE_SERVICE_ROLE_KEY` のコード利用は見つかっていない
- [x] クライアント・サーバー共通で publishable key を使い、RLSを前提にした構成になっている

### 入力・表示

- [x] Server Actionで主要なフォーム入力の形式・長さ・列挙値を検証している
- [x] `dangerouslySetInnerHTML`、`eval`、`new Function` の利用は見つかっていない
- [x] 外部画像URLは Supabase Storage / YouTube系ホストに制限している

## ToDo

### Critical: 権限昇格の防止

- [x] `profiles` のRLSを見直し、一般ユーザーが自分の `role` を `admin` に作成・更新できないようにする
- [x] `profiles.role` の変更を原則禁止するDB triggerを追加し、ロール変更は管理者運用または専用RPCだけに限定する
- [ ] 学生・監督の初期ロール設定、招待済み保護者の初期設定が壊れないことを確認する

### Critical: チーム所属・監督権限の防止

- [x] `team_members` の insert policy を見直し、学生は `role_in_team = 'student'` の自己参加のみ許可する
- [x] 監督は自分が作成したチームに限り `role_in_team = 'coach'` で自己追加できるようにする
- [x] `find_team_by_code` RPCは学生ロールのみ実行可能にし、チームコード経由の参加を学生用途に限定する

### High: 通知のなりすまし防止

- [x] `notifications_insert_authenticated` の `with check (true)` を廃止する
- [x] コメント・リアクション作成後の通知は、DB trigger または権限を固定したRPCで作成する
- [ ] 任意ユーザーが他ユーザー宛の通知を直接作成できないことを確認する

### Medium: データ閲覧範囲の最小化

- [x] `profiles_select_authenticated` を見直し、プロフィール閲覧を本人・同チーム・親子リンク・管理者など必要範囲に限定する
- [x] `contents` の対象ロールをアクセス制御として扱う場合、RLSでも `for_student` / `for_parent` / `for_coach` を `current_user_role()` に応じて判定する
- [ ] 公開サムネイルの Storage policy は現状維持でよいか、公開範囲の仕様として明文化する

### 依存関係・セキュリティヘッダー

- [x] `npm audit` で検出された `postcss <8.5.10` のXSS advisoryへの対応方針を決める
- [x] `overrides` で `postcss >=8.5.10` を固定できるか検証する
- [ ] Next.jsのマイナー更新で解消されるか継続確認する
- [x] `next.config.ts` または Proxyで基本セキュリティヘッダーを追加する

### Zenn公開前チェックリスト

https://zenn.dev/catnose99/articles/547cbf57e5ad28

- [ ] Supabase Auth Cookie の `HttpOnly` / `SameSite` / `Secure` / `Domain` 属性が適切に設定されていることを確認する
- [ ] GETリクエストで更新・削除・既読化などの副作用が起きないことを確認する
- [ ] CSP方針を決め、少なくとも `frame-ancestors 'none'` 相当のクリックジャッキング対策を確認する
- [ ] `Strict-Transport-Security` に `preload` を付与するか判断する
- [ ] 管理コンテンツの `external_video_url` / `thumbnail_url` で、URLスキーム・許可ホスト・表示先の安全性を確認する
- [ ] サムネイルアップロードで、MIME type / サイズ / 拡張子 / Storage側 allowed MIME が期待どおり機能することを確認する
- [ ] Supabase Storage の一覧公開・推測可能パス・公開範囲・バックアップ方針を確認する
- [ ] ユーザー固有レスポンスがVercel/CDN/ブラウザ共有キャッシュに保存されないことを確認する
- [ ] 保護者招待OTPの送信・再送がスパム化しないよう、Supabase Auth rate limit とアプリ側導線を確認する
- [ ] ログイン・OTP検証・保護者招待で登録済みメールアドレスの列挙ができないことを確認する
- [ ] サーバーエラーやSupabaseエラーの詳細をブラウザにそのまま表示していないことを確認する
- [ ] Supabase DBバックアップ、Storageバックアップ、Supabase/Vercel/GitHubアカウントの2FAを運用として確認する
- [ ] `localStorage` のPWAインストール案内dismiss情報が消えても機能上問題ないことを確認する
- [ ] 長い表示名・チーム名・カテゴリ・コメント・コンテンツタイトルでUIが崩れないことを確認する

### 検証

- [ ] Supabase JS client または REST APIから、`profiles.role = 'admin'` の直接作成・更新が拒否されることを確認する
- [ ] `team_members.role_in_team = 'coach'` の不正自己追加が拒否されることを確認する
- [ ] 任意ユーザー宛の `notifications` 直接 insert が拒否されることを確認する
- [ ] 正常系として、学生初期設定が動作することを確認する
- [ ] 正常系として、監督チーム作成が動作することを確認する
- [x] 正常系として、学生チーム参加が動作することを確認する
- [ ] 正常系として、保護者招待・承認が動作することを確認する
- [x] 正常系として、コメント・リアクション通知が動作することを確認する
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm audit --json`

## 対応方針

### 1. DB/RLSを最終防衛線にする

- Supabase publishable key はクライアント公開前提のため、アプリ側のフォーム制限やServer Actionのロールチェックだけに依存しない
- 権限に関わる `role`、`role_in_team`、通知作成者・受信者は、RLS・trigger・専用RPCで必ず制約する
- 既存の正常導線は維持しつつ、DB APIを直接叩かれても権限境界を越えられない状態にする

### 2. ロール変更を明示的な運用に寄せる

- 一般ユーザーが自分で選べるロールは初期設定時の `student` / `coach` と、招待済みメールに紐づく `parent` に限定する
- `admin` はセルフサインアップや通常フォームから付与しない
- 将来的に管理画面からロール変更する場合は、admin-only RPCを別チケットで設計する

### 3. 通知は副作用として安全に作る

- 現在の `notifications` はアプリ層で妥当性を担保する設計だが、DB直アクセスに弱い
- コメント・リアクションのinsertは既にRLSで対象記録へのアクセスを確認しているため、その成功後にDB側で通知を作る
- Server Actionから任意の `user_id` を指定して通知作成する経路は削除する

### 4. 依存関係は実害と互換性を分けて対応する

- `npm audit` の検出内容は moderate だがXSS系のため放置しない
- Next.js 16系の互換性を維持し、まず `overrides` や lockfile更新で解消できるか検証する
- 互換性問題が出る場合は、Next.js側の修正版リリースを追跡し、デプロイ前チェックに `npm audit` を含める

## 調査メモ

- `profiles_insert_self` / `profiles_update_self` は `auth.uid() = id` のみで、`role` の値を制約していない
- `team_members_insert_self` は `auth.uid() = user_id` のみで、`role_in_team` の値を制約していない
- `notifications_insert_authenticated` は `with check (true)` で任意insertを許可している
- `contents_select_published_or_owner` は `published` であれば対象ロールに関係なくDB上は閲覧可能
- `npm audit --omit=dev --json` では `next` / `postcss` に moderate 2件が出ている
- Zenn記事「Webサービス公開前のチェックリスト」を参照し、このアプリに関係する公開前確認項目を追加した。決済、メルマガ、公開SEO/OGP/XMLサイトマップは現状のアプリ範囲外として除外した
