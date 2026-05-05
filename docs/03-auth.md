# 03 認証実装

## 概要
Supabase Authを使ったメール認証コードによるパスワードレスログイン。

## ToDo

### middleware (Next.js 16では `proxy.ts`)
- [x] `proxy.ts` をプロジェクトルートに作成（Next.js 16でMiddlewareはProxyに改名）
- [x] `supabase.auth.getClaims()` でトークンを更新
- [x] 更新済みトークンを `request.cookies.set` と `response.cookies.set` の両方に渡す
- [x] 未認証ユーザーを保護ルートからログインページへ `redirect`

### ログイン画面（全ロール共通）
- [x] `app/(auth)/login/page.tsx` を作成
- [x] メールアドレス入力フォームを実装
- [x] OTP（認証コード）送信のServer Actionを実装
- [x] `app/(auth)/login/verify/page.tsx` を作成（コード入力画面）
- [x] コード検証のServer Actionを実装
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

## 実装メモ

### 作成ファイル
- `proxy.ts` — Next.js 16ではMiddlewareがProxyに改名された
- `utils/supabase/proxy.ts` — `updateSession` ヘルパー
- `lib/auth.ts` — `getPostLoginPath()` ロール別リダイレクト先決定
- `app/(auth)/layout.tsx` — 共通レイアウト
- `app/(auth)/login/page.tsx` / `login-form.tsx` / `actions.ts`
- `app/(auth)/login/verify/page.tsx` / `verify-form.tsx`

### Server Actions
- `sendOtp` — メール宛にOTP送信、成功時に `/login/verify?email=...` へ遷移
- `verifyOtp` — 6桁コード検証、成功時に `getPostLoginPath()` でロール別ホームへ
- `signOut` — ログアウト後 `/login` へ

### 後続チケットの依存
- `profiles` テーブルはチケット04で作成。それまで `getPostLoginPath()` は常に `/setup` を返す
- `/student` `/coach` `/parent` `/admin` `/setup` の各ホームは後続チケットで作成
