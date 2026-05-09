# 03 認証実装

## 概要
Supabase Authを使った共通ログイン。メール+パスワード認証を基本とし、保護者招待フローの初回本人確認のみOTPを利用する。

## ToDo

### proxy（Next.js 16でMiddlewareは `proxy.ts` に改名）
- [x] `proxy.ts` をプロジェクトルートに作成（Next.js 16でMiddlewareはProxyに改名）
- [x] `supabase.auth.getClaims()` でトークンを更新
- [x] 更新済みトークンを `request.cookies.set` と `response.cookies.set` の両方に渡す
- [x] 未認証ユーザーを保護ルートからログインページへ `redirect`

### ログイン画面（全ロール共通）
- [x] `app/(auth)/login/page.tsx` を作成
- [x] メールアドレス＋パスワード入力フォームを実装
- [x] 保護者初回設定用のOTP検証フォームを実装
- [x] `signInWithPassword` のServer Actionを実装
- [x] `verifyInitialParentOtp` のServer Actionを実装
- [x] ログイン成功後にロール別ホームへ `redirect`

### ロール判定
- [x] `profiles.role` の値（student / coach / parent / admin）でリダイレクト先を分岐
- [x] 未設定（初回ログイン）の場合は初期設定画面（`/setup`）へ遷移
- [x] ページ側の認証・プロフィール取得を `lib/current-user.ts` に共通化

### ログアウト
- [x] ログアウトのServer Actionを実装（`supabase.auth.signOut()`）
- [x] ログアウト後にログイン画面へ `redirect`

## 重要ルール
- サーバーコードでは `getSession()` を使わない。必ず `getClaims()` を使う
- Server Actionの中でも認証チェックを必ず行う
- ログイン失敗時のエラーメッセージはメール／パスワードどちらが間違いか区別しない（ユーザー列挙防止）

## 実装メモ

### 作成ファイル
- `proxy.ts` — Next.js 16ではMiddlewareがProxyに改名された
- `utils/supabase/proxy.ts` — `updateSession` ヘルパー
- `lib/auth.ts` — `getPostLoginPath()` ロール別リダイレクト先決定
- `lib/current-user.ts` — Server Component向けの現在ユーザー・ロール取得ヘルパー
- `app/(auth)/layout.tsx` — 共通レイアウト
- `app/(auth)/login/page.tsx` / `login-form.tsx` / `actions.ts`

### パフォーマンスメモ
- Proxyは通常の保護ページでは `profiles` を取得せず、`/setup` と `/admin` のようにProxy段階でロール判定が必要な経路だけDBを読む
- Server Componentでは `requireRole()` を使い、同一リクエスト内の現在ユーザー取得を `cache()` で重複抑制する

### Server Actions
- `signInWithPassword` — メール＋パスワード認証、成功時に `getPostLoginPath()` でロール別ホームへ
- `verifyInitialParentOtp` — 保護者の初回招待OTPを検証。初期設定済みの保護者はパスワードログインへ誘導
- `signOut` — ログアウト後 `/login` へ

### アカウント管理
- 現時点では、学生・監督のアカウント作成はSupabaseダッシュボード（Authentication → Users → Add user）で管理者が行う
- 保護者は招待時のOTP送信でアカウント作成され、初回設定でパスワードを必須設定する
- 現時点では、アプリ内に学生・監督向けのサインアップ画面は設けない
- 将来的には、学生・監督もユーザー自身が新規登録できるサインアップ画面を追加する

### 将来対応: セルフサインアップ
- 学生・監督が自分でメールアドレスとパスワードを登録できる導線を追加する
- 登録後は既存の `/setup` でロール、表示名、学生プロフィールを設定する
- 保護者は引き続き学生からの招待を起点に登録する
- MVP期間中は管理者によるSupabase手動登録を正式な運用とする

### 後続チケットの依存
- `profiles` テーブルはチケット04で作成。それまで `getPostLoginPath()` は常に `/setup` を返す
- `/home` `/coach` `/parent` `/setup` の各ホームは後続チケットで作成
