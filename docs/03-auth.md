# 03 認証実装

## 概要
Supabase Authを使った共通ログイン。メール+パスワードに加えてメールOTP認証にも対応し、保護者招待フローではOTPを利用する。

## ToDo

### proxy（Next.js 16でMiddlewareは `proxy.ts` に改名）
- [x] `proxy.ts` をプロジェクトルートに作成（Next.js 16でMiddlewareはProxyに改名）
- [x] `supabase.auth.getClaims()` でトークンを更新
- [x] 更新済みトークンを `request.cookies.set` と `response.cookies.set` の両方に渡す
- [x] 未認証ユーザーを保護ルートからログインページへ `redirect`

### ログイン画面（全ロール共通）
- [x] `app/(auth)/login/page.tsx` を作成
- [x] メールアドレス＋パスワード入力フォームを実装
- [x] OTP送信フォームとOTP検証フォームを実装
- [x] `signInWithPassword` のServer Actionを実装
- [x] `sendLoginOtp` / `verifyLoginOtp` のServer Actionを実装
- [x] ログイン成功後にロール別ホームへ `redirect`

### ロール判定
- [x] `profiles.role` の値（student / coach / parent / admin）でリダイレクト先を分岐
- [x] 未設定（初回ログイン）の場合は初期設定画面（`/setup`）へ遷移

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
- `app/(auth)/layout.tsx` — 共通レイアウト
- `app/(auth)/login/page.tsx` / `login-form.tsx` / `actions.ts`

### Server Actions
- `signInWithPassword` — メール＋パスワード認証、成功時に `getPostLoginPath()` でロール別ホームへ
- `sendLoginOtp` / `verifyLoginOtp` — OTP送信と検証。保護者招待フローでも利用
- `signOut` — ログアウト後 `/login` へ

### アカウント管理
- 学生・監督のアカウント作成はSupabaseダッシュボード（Authentication → Users → Add user）で管理者が行う
- 保護者は招待時のOTP送信でアカウント作成される
- アプリ内に一般向けサインアップ画面は設けない

### 後続チケットの依存
- `profiles` テーブルはチケット04で作成。それまで `getPostLoginPath()` は常に `/setup` を返す
- `/home` `/coach` `/parent` `/setup` の各ホームは後続チケットで作成
