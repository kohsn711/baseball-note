# CLAUDE.md

このファイルはリポジトリで作業する際のClaude Code（claude.ai/code）向けガイダンスです。

@AGENTS.md

---

## プロジェクト概要

中学生〜高校生の野球選手向け「野球ノートアプリ」のMVP。

学生がスマートフォンで、自主練習・体づくり・食事・睡眠・体重・ケガ/痛み・日記/振り返りを継続的に記録できるようにする。監督と保護者は選手の記録を閲覧し、リアクションやコメントで継続を支援する。

**MVPの最重要目的：学生が日々の記録を継続できるかを検証すること。**

---

## コマンド

```bash
npm run dev      # 開発サーバー起動（Next.js Turbopack）
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint（フラット設定、v9）
```

テストランナーは未設定。

---

## 技術スタック

- **Framework**: Next.js App Router（TypeScript）
- **Hosting**: Vercel
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth（メール+パスワードログインとメールOTPログイン）
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS v4（`@tailwindcss/postcss` 経由、`tailwind.config.js` は使わない）
- **ESLint v9**: フラット設定（`eslint.config.mjs`、`.eslintrc` は存在しない）
- **動画**: 外部URLのみ（自前アップロード・変換・配信は実装しない）

MVPでは独立したAPIサーバーを作らない。Next.js Server Actions または Route Handlers を使う。

---

## ターゲットユーザー

| ロール | できること |
|--------|-----------|
| Student | 自分の記録を作成・編集・閲覧。目標設定。コンテンツ閲覧 |
| Coach | 所属チームの選手記録・目標を閲覧。リアクション・コメント送信 |
| Parent | 自分の子どもの記録のみ閲覧。リアクション・コメント送信 |
| Admin | ロールとRLSは存在。コンテンツ管理UIは未実装 |

---

## MVPスコープ

**現時点で実装済み:**
- メール+パスワードログインとメールOTPログイン
- 学生の初期設定、チームコードによるチーム参加
- 保護者メール登録と保護者承認
- 1日1記録の作成・編集・閲覧（カテゴリ別入力）
- カレンダーによる記録状況表示、連続記録日数表示
- 目標設定・進捗確認
- 監督/保護者によるリアクション・コメント
- アプリ内通知
- 学生・保護者・監督向けコンテンツ閲覧

**未実装（チケット残）:**
- 管理者向けコンテンツ管理UI
- 自動テスト
- デプロイ整備

**実装しないもの（指示があるまで）:**
試合結果・選手成績・ランキング・チームメイトへの記録公開・SNSフィード・自前動画アップロード・広告管理・決済・物販・LINE/Google/Appleログイン・ネイティブアプリ・複雑な分析ダッシュボード

---

## アーキテクチャ

`pages/` ディレクトリは使わない。App Routerのみ使用。Server Componentsがデフォルト — ブラウザAPIやインタラクティブな処理が必要な場合のみ `"use client"` を付ける。DB操作はサーバー側に寄せる。

### ディレクトリ構成

```
app/
  (auth)/login/        # 共通ログイン画面
  (student)/           # 学生用ルートグループ
  (coach)/             # 監督用ルートグループ
  (parent)/            # 保護者用ルートグループ
  layout.tsx           # ルートレイアウト
  globals.css          # グローバルスタイル（Tailwind import）
components/            # 再利用コンポーネント（app/外）
utils/supabase/        # Supabaseクライアント
  server.ts            # Server Components / Server Actions / Route Handlers 用
  client.ts            # Client Components 用
lib/                   # ドメインロジック・ユーティリティ
proxy.ts               # 認証トークン更新・保護ルート
docs/                  # 機能チケット（連番マークダウン）
```

ロール別ルートグループ `(student)` `(coach)` `(parent)` でURLに影響を与えずレイアウトを共有する。`admin` ロールはDB/RLSには存在するが、現時点で `app/(admin)` は未実装。

### 主要画面

**Student:** Login / Initial Setup / Student Home / Today Record / Record Detail / Goals / Notifications / Contents List / Content Detail / My Page

**Coach:** Login / Team Dashboard / Student List / Student Record Detail / Student Goals / Contents / My Page

**Parent:** Login / Parent Home / Child Record Detail / Parent Links / Contents List / Content Detail / My Page

**Admin:** Planned only（Content List / Content Create・Edit / Content Publish Management は未実装）

### 学生ホームの優先表示順
1. 今日の記録ボタン
2. 今日のひとこと
3. カレンダー
4. 連続記録日数
5. 最近のリアクション/コメント

---

## データモデル

### 記録ルール

記録は「1日1記録」。`daily_records` を親テーブルとしカテゴリ別の子データを紐づける。

| カテゴリ | テーブル | 内容 |
|---------|---------|------|
| practice | practice_entries | 素振り・ティー打撃・キャッチボール・投球・守備・走塁・自由メモ |
| training | training_entries | ランニング・ダッシュ・腕立て・腹筋・スクワット・ストレッチ・自由メモ |
| meal | meal_records | 朝食・昼食・夕食・補食（ate/skipped）、水分、食事メモ |
| condition | condition_records | 睡眠時間・起床/就寝時刻・体重・体調（good/normal/bad） |
| injury | injury_records | 痛みの有無・部位・痛みレベル1〜5・練習への影響・メモ |
| reflection | reflection_records | できたこと・課題・明日やること・今日の気分1〜5 |

未入力カテゴリがあっても保存できること。

### 目標（goals）

学生が自分で設定する目標。記録継続のモチベーション維持が目的。

主要フィールド:
- title: 目標タイトル
- description: 目標内容
- category: practice / training / meal / condition / general
- target_date: 達成期限
- status: active / achieved / abandoned
- created_at / updated_at

学生は複数の目標を設定できる。`status = active` のものは目標タブで確認し、監督は所属チーム学生の目標を閲覧できる（編集不可）。

### 主要テーブル一覧

```
auth.users（Supabase Auth管理）/ profiles / teams / team_members / parent_child_links
daily_records / practice_entries / training_entries / meal_records
condition_records / injury_records / reflection_records
goals / reactions / preset_comments / comments
contents / notifications
```

### 主要リレーション

- auth.users 1:1 profiles
- teams 1:N team_members（users 1:N team_members）
- users(parent) 1:N parent_child_links ← users(student)
- users(student) 1:N daily_records
- daily_records 1:N practice_entries, training_entries
- daily_records 1:1 meal_records, condition_records, injury_records, reflection_records
- daily_records 1:N reactions, comments
- preset_comments はコメント入力補助用のマスターデータ
- users(student) 1:N goals
- users(admin) 1:N contents
- users 1:N notifications

---

## 権限管理

権限チェックは省略しない。RLSとアプリケーション側チェックを併用する。

| ロール | 権限 |
|--------|------|
| Student | 自分の記録・目標のみ作成・編集・閲覧。公開済みコンテンツ閲覧 |
| Coach | 所属チームの学生記録・目標のみ閲覧。対象学生の記録にリアクション・コメント |
| Parent | activeな親子リンクで紐づく子どもの記録のみ閲覧・リアクション・コメント |
| Admin | コンテンツの作成・編集・公開管理 |

**RLS対象テーブル:** daily_records / parent_child_links / team_members / goals / reactions / comments / notifications / contents

---

## リアクションとコメント

記録全体に対してリアクションスタンプとコメントを送信できる。コメントは自由記述で、`preset_comments` を候補ボタンとして補助利用する。

コメント候補例: よく頑張った / 継続できている / 無理しすぎ注意 / 明日も続けよう / 食事も意識できている

---

## コンテンツ

対象: 学生向け・保護者向け・監督向け（`for_student` / `for_parent` / `for_coach`）

主要フィールド: title / body / thumbnail_url / category / external_video_url / for_student / for_parent / for_coach / status（draft/published/archived）/ published_at / created_by

---

## 通知

MVPではアプリ内通知のみ。プッシュ通知は後回し。

通知対象: 監督/保護者からのリアクション・コメント

---

## セキュリティ・プライバシー

- 未成年の情報を扱うため公開範囲を厳密に制御する
- 学生の記録は本人・紐づく保護者・所属チームの監督のみ閲覧可能（チームメイトには非公開）
- `SUPABASE_SERVICE_ROLE_KEY` をブラウザに公開しない
- ケガ・健康情報は医療判断として扱わない
- 環境変数をハードコードしない

---

## コーディング規約

### 命名規則
- DBテーブル名・カラム名: `snake_case`
- TypeScript変数・関数名: `camelCase`
- Reactコンポーネント名: `PascalCase`
- URLパス: `kebab-case`

### 開発方針
- 型定義を明確にする
- DB操作はサーバー側に寄せる（Server Actions / Route Handlers）
- 認証状態・権限チェックを必ず確認する
- UIはスマホファーストで作る（1分程度で最低限の記録ができること）
- Server Component / Client Component の責務を分ける
- MVPに不要な抽象化を増やしすぎない
- 必須入力を増やしすぎない。数値・選択・チェック式を中心にする

### Next.js App Router ベストプラクティス

**⚠️ このバージョン固有の破壊的変更**
- `params` / `searchParams` はすべて **Promise** になった。`const { id } = await params` のように await が必須
- `fetch` はデフォルトでキャッシュ**されない**（Next.js 13〜14 の挙動と逆）。キャッシュしたい場合は `'use cache'` ディレクティブを使う
- キャッシュモデルが `cache: 'no-store'` / `next: { revalidate }` から `'use cache'` + `cacheLife()` に変わった

**Server Component / Client Component の分離**
- デフォルトはServer Component。`"use client"` は最小単位のリーフコンポーネントにのみ付ける
- `useState` / `useEffect` / ブラウザAPI / カスタムHooksが必要なコンポーネントのみClient Componentにする
- データフェッチはServer Componentで行い、取得済みデータをpropsでClient Componentに渡す
- React Contextはコンテキストプロバイダーを `"use client"` のClient Componentに分離し、Server Componentでchildrenを渡す
- サーバー専用コードを誤ってクライアントに含めないよう `server-only` パッケージを活用する

**データフェッチ**
- Server Componentでは `async/await` で直接フェッチする（`useEffect` でのフェッチは使わない）
- `fetch` リクエストはデフォルトでキャッシュされない。毎リクエストで新鮮なデータが返る
- キャッシュしたいデータには `'use cache'` ディレクティブ + `cacheLife()` を使う
- 独立した複数のフェッチは `Promise.all` で並列実行する（逐次 `await` は避ける）

```ts
// ✅ 並列フェッチ
const [record, profile] = await Promise.all([getRecord(id), getProfile(userId)])

// ❌ 逐次フェッチ（遅い）
const record = await getRecord(id)
const profile = await getProfile(userId)
```

**キャッシュ**
- データをキャッシュするには関数やコンポーネントの先頭に `'use cache'` を追加し `cacheLife()` で有効期間を指定する
- リクエストごとに新鮮なデータが必要な場合は `<Suspense>` で囲むだけでよい（`'use cache'` は付けない）
- `cookies()` / `headers()` などランタイムAPIにアクセするコンポーネントは `<Suspense>` で囲む

**Streaming**
- ページ全体のローディングUIは `loading.tsx` を同じディレクトリに配置する
- 部分的なストリーミングには `<Suspense fallback={<Skeleton />}>` でデータ取得コンポーネントを囲む
- スケルトンUIなど意味のあるfallbackを提供する

**Server Actions（データ変更）**
- `'use server'` ディレクティブを関数の先頭に付ける。Client Componentから使う場合は専用ファイル（`actions.ts`）に分離する
- Server Actionの中で必ず認証・権限チェックを行う（直接POSTリクエストが届く可能性があるため）
- ミューテーション後は `revalidatePath()` または `revalidateTag()` でキャッシュを更新し、必要なら `redirect()` で遷移する
- `redirect()` はthrowするため、その後のコードは実行されない。`revalidatePath` より前に呼ばない
- ペンディング状態の表示には `useActionState` を使う

**ルーティング・ファイル構成**
- ルートは `app/` 配下に置く。各ディレクトリに `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` を必要に応じて配置する
- `error.tsx` には必ず `"use client"` を付ける
- 動的ルートは `[param]`、キャッチオールは `[...param]`、ルートグループは `(group)` で表現する
- 再利用コンポーネントは `app/` 外の `components/` に置く

**パフォーマンス**
- `next/image` を使い `width` / `height` または `fill` を必ず指定する（`<img>` タグを直接使わない）
- `next/link` を使う（`<a>` タグを直接使わない）
- ページ上部に表示される画像には `priority` を付ける
- 重いClient Componentは `next/dynamic` で遅延ロードする

**メタデータ・SEO**
- `metadata` オブジェクトまたは `generateMetadata` 関数をServer Componentでexportする
- `<head>` タグを直接書かない

**エラーハンドリング**
- `notFound()` を使って404を返す。`redirect()` を使ってリダイレクトする
- Server Actionsの戻り値でエラー状態をクライアントに返す（`try/catch` + 戻り値オブジェクト）

**Supabase Auth 連携**

インストール:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

環境変数（`.env.local`）:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
- 旧来の `anon` / `service_role` キーは非推奨。新しい publishable キー（`sb_publishable_xxx`）を使う
- `SUPABASE_SERVICE_ROLE_KEY`（またはsecretキー）はサーバー側のみ。クライアントには絶対に渡さない

クライアント作成パターン（`utils/supabase/` に配置）:

```ts
// utils/supabase/server.ts — Server Components / Server Actions / Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Componentからのset失敗は無視 */ }
        },
      },
    }
  )
}

// utils/supabase/client.ts — Client Components
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
```

セッション・認証のルール:
- **`getClaims()` を使う** — JWTの署名をプロジェクトの公開鍵で毎回検証するため安全
- **`getSession()` をサーバーコード・proxyで使ってはいけない** — トークンの再検証が保証されない
- proxyでトークンを更新し、更新済みトークンをServer ComponentとブラウザのCookieに渡す
- ISR / CDN を使う場合、セッショントークンが含まれるレスポンスをキャッシュしてはいけない（他ユーザーのセッションが漏洩する）

proxy.ts（必須）:
- `supabase.auth.getClaims()` を呼び出してトークンを更新する
- 更新済みトークンを `request.cookies.set` と `response.cookies.set` の両方に渡す
- 保護が必要なルートはproxyで認証チェックを行い、未認証ならログインページへ `redirect`

---

## 開発順序

1. Next.jsプロジェクト作成
2. Supabaseプロジェクト作成・環境変数設定
3. 認証実装
4. DBマイグレーション・RLS設定
5. 学生初期設定
6. 学生ホーム
7. 今日の記録作成・編集
8. 記録詳細
9. 学生の目標設定・進捗確認
10. チーム作成・チーム参加
11. 監督の選手一覧・記録閲覧
12. 保護者メール登録・保護者承認
13. 保護者ホーム・子どもの記録閲覧
14. リアクション・コメント
15. アプリ内通知
16. コンテンツ一覧・詳細
17. 運営コンテンツ管理
18. 最低限のテスト
19. Vercelデプロイ
