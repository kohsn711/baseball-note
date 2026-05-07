# 16b 下部ナビゲーションバー・マイページ・UI改善

## 概要

チケット16までで学生・保護者・監督の主要機能が揃ったタイミングで、クライアント向け UI を整備した。
画面間の移動を「ホームに戻る → 各機能」の往復から、下部固定ナビゲーションバーによる直接アクセスに変更。

---

## BottomNav（下部ナビゲーションバー）

### コンポーネント（`components/bottom-nav.tsx`）
- `role: 'student' | 'parent' | 'coach'` を props で受け取りタブを描画（Client Component）
- アクティブタブ判定: `usePathname()` を使い、各タブに `matchPaths` を定義して**最長プレフィックス一致**で判定
  - 例: `/coach/contents`（score 15）は `/coach`（score 6）より優先されるため「コンテンツ」タブが点灯
- `/setup` `/login` では非表示（`HIDE_PREFIXES` チェック）
- iOS セーフエリア対応: `padding-bottom: env(safe-area-inset-bottom)` を `.bottom-nav` ユーティリティとして `globals.css` に定義

### タブ構成

**学生（4タブ）**
| タブ | href | matchPaths |
|---|---|---|
| 記録 📝 | `/home` | `/home`, `/records` |
| 目標 🎯 | `/goals` | `/goals` |
| コンテンツ 📖 | `/contents` | `/contents` |
| マイページ 👤 | `/mypage` | `/mypage`, `/settings` |

**保護者（3タブ）**
| タブ | href | matchPaths |
|---|---|---|
| お子さま 👨‍👩‍👧 | `/parent` | `/parent` |
| コンテンツ 📖 | `/parent/contents` | `/parent/contents` |
| マイページ 👤 | `/parent/mypage` | `/parent/mypage`, `/parent/links` |

- 当初「ホーム」「お子さま」の2タブが役割重複しており、「ホーム＝お子さま」に統合して3タブ化

**監督（3タブ）**
| タブ | href | matchPaths |
|---|---|---|
| 選手 👥 | `/coach` | `/coach`, `/coach/students` |
| コンテンツ 📖 | `/coach/contents` | `/coach/contents` |
| マイページ 👤 | `/coach/mypage` | `/coach/mypage`, `/coach/team` |

### 各 layout への組み込み（`app/(student|parent|coach)/layout.tsx`）
- `<BottomNav role="..." />` を各レイアウトに追加
- コンテンツ領域がナビに隠れないよう `pb-nav`（`= calc(4rem + env(safe-area-inset-bottom))`）を適用

---

## マイページ（新規）

各ロールに「マイページ」を新設し、設定系機能を集約。

| ファイル | 内容 |
|---|---|
| `app/(student)/mypage/page.tsx` | プロフィール / 通知 / 保護者管理 / チーム参加 / ログアウト |
| `app/(parent)/parent/mypage/page.tsx` | プロフィール / 招待・連携 / ログアウト |
| `app/(coach)/coach/mypage/page.tsx` | プロフィール / チーム作成 / ログアウト |

- ログアウトは `lib/auth-actions.ts` の `signOut()` Server Action を共有
- ログアウト後は `/login` へリダイレクト

---

## PageHeader（粘着ヘッダー）

### コンポーネント（`components/page-header.tsx`）
```tsx
<header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
  <div className="mx-auto flex min-h-10 max-w-md items-center justify-between gap-3">
    {children}
  </div>
</header>
```

### 適用ページ（10画面）
- 学生: ホーム / 目標 / コンテンツ / マイページ / 通知
- 保護者: お子さま（`/parent`） / コンテンツ / マイページ
- 監督: 選手（`/coach`） / コンテンツ / マイページ

---

## 学生ホームの通知ベル

- `HeaderBell`（`fixed` 全画面オーバーレイ）は廃止
- ホームの `PageHeader` 右側にインライン配置:「チーム名 + ベルアイコン」を横並び
- `countUnreadNotifications(userId)` を他フェッチと `Promise.all` で並列取得
- バッジ: `h-5 min-w-5 px-1 text-[10px]` の rose-500 ラベル、99件超は `99+`

---

## 通知既読処理の改善

- 通知ページ（`/notifications`）表示時に未読がある場合、`revalidatePath('/', 'layout')` を呼びホームのベルバッジを即時リセット
- 学生 layout に `export const dynamic = 'force-dynamic'` を追加し毎リクエストで未読数を再取得

---

## ホーム画面の重複導線整理

BottomNav 追加に伴い、各ホームの重複セクションを削除。

**学生ホーム（削除したセクション）**
- ヘッダー内旧通知ボタン（固定オーバーレイのベルに移行後、さらにPageHeader内ベルに統合）
- コンテンツセクション（BottomNavで代替）
- 保護者の登録セクション（マイページに集約）
- 目標進捗セクション（BottomNavの目標タブで代替）

**保護者ホーム（削除したセクション）**
- コンテンツセクション（BottomNavで代替）
- 招待・連携セクション（マイページに集約）

**監督ホーム（削除したセクション）**
- コンテンツセクション（BottomNavで代替）
- 「新しく作る」チーム作成リンク（マイページに集約）

---

## 実装ファイル一覧

| ファイル | 種別 | 内容 |
|---|---|---|
| `components/bottom-nav.tsx` | 新規 | BottomNav（Client Component） |
| `components/page-header.tsx` | 新規 | 粘着ページヘッダー（Server Component） |
| `components/sign-out-button.tsx` | 新規 | ログアウトボタン |
| `lib/auth-actions.ts` | 新規 | `signOut()` Server Action |
| `app/(student)/mypage/page.tsx` | 新規 | 学生マイページ |
| `app/(parent)/parent/mypage/page.tsx` | 新規 | 保護者マイページ |
| `app/(coach)/coach/mypage/page.tsx` | 新規 | 監督マイページ |
| `app/(student)/layout.tsx` | 修正 | BottomNav 組み込み、`force-dynamic` |
| `app/(parent)/layout.tsx` | 修正 | BottomNav 組み込み |
| `app/(coach)/layout.tsx` | 修正 | BottomNav 組み込み |
| `app/globals.css` | 修正 | safe-area ユーティリティ追加 |
| `app/(student)/home/page.tsx` | 修正 | PageHeader 化、ベル統合、目標・重複導線削除 |
| `app/(student)/goals/page.tsx` | 修正 | PageHeader 化、旧ホームリンク削除 |
| `app/(student)/contents/page.tsx` | 修正 | PageHeader 化、旧ホームリンク削除 |
| `app/(student)/mypage/page.tsx` | 修正 | PageHeader 化 |
| `app/(student)/notifications/page.tsx` | 修正 | PageHeader 化、revalidatePath 追加 |
| `app/(parent)/parent/page.tsx` | 修正 | PageHeader 化、重複導線削除 |
| `app/(parent)/parent/contents/page.tsx` | 修正 | PageHeader 化、旧ホームリンク削除 |
| `app/(parent)/parent/mypage/page.tsx` | 修正 | PageHeader 化 |
| `app/(coach)/coach/page.tsx` | 修正 | PageHeader 化、チーム作成リンク削除 |
| `app/(coach)/coach/contents/page.tsx` | 修正 | PageHeader 化、旧ホームリンク削除 |
| `app/(coach)/coach/mypage/page.tsx` | 修正 | PageHeader 化 |
| `app/(student)/records/[date]/record-form.tsx` | 修正 | 保存ボタンを `sticky-above-nav` でナビ高さ分オフセット |
