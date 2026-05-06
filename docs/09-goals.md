# 09 学生の目標設定・進捗確認

## 概要
学生が自分で目標を設定・管理し、進捗を確認する機能。記録継続のモチベーション維持が目的。

## ToDo

### 目標一覧画面（`app/(student)/goals/page.tsx`）
- [x] active な目標一覧を表示
- [x] 達成済み（achieved）・断念（abandoned）の切り替えタブ（`?status=` で切替）
- [x] 「新規作成」ボタン
- [x] 各目標の編集リンク・ステータス変更ボタン
- [x] 一覧では内容（description）は表示しない（タイトル / カテゴリ / 期限 のみ。詳細は編集画面で確認）

### 目標作成・編集（`app/(student)/goals/new/page.tsx` / `app/(student)/goals/[id]/edit/page.tsx`）
- [x] タイトル入力
- [x] 内容（description）入力
- [x] カテゴリ選択（practice / training / meal / condition / general）
- [x] 達成期限（target_date）入力
- [x] 保存Server Action（`goals` テーブルに insert / update）
- [x] 認証・本人確認チェック（`requireStudent` + RLS の二重防御）

### ステータス変更（`app/(student)/goals/status-buttons.tsx`）
- [x] active の目標: 「達成」ボタン → `status` を `achieved` に更新
- [x] active の目標: 「断念」ボタン → `status` を `abandoned` に更新
- [x] achieved / abandoned の目標: 「再開」ボタンのみ表示 → `status` を `active` に戻す
- [x] 終了状態（achieved / abandoned）から別の終了状態への直接遷移は不可（誤操作防止）

### 学生ホームへの表示
- [x] `status = active` の目標を学生ホームのサマリーに表示（06と連携、既存の `fetchActiveGoals` を利用）

### コーチからの閲覧
- [ ] コーチダッシュボードから所属チーム学生の目標一覧を閲覧（11と連携）
- [ ] コーチは閲覧のみ（編集・作成不可）

### アクセス制御
- [x] 学生は自分の目標のみ作成・編集・閲覧
- [x] コーチは所属チーム学生の目標を閲覧のみ（RLS `goals_select` で許可済み、UIは11で実装）
- [x] 保護者は閲覧不可（MVP範囲外、RLSで遮断）

## 実装メモ
- 定数・型は `lib/goals-constants.ts`、Supabase アクセスを伴う fetch 関数は `lib/goals.ts`（`server-only`）に分離
  - Client Component（`goal-form.tsx` / `status-buttons.tsx`）は constants のみ import するため
- `useActionState` 用の Server Action は `app/(student)/goals/actions.ts` に集約
- 編集画面では `updateGoal.bind(null, goalId)` で goalId を Server Action にバインド
- 保存・ステータス変更後は `revalidatePath('/goals')` と `revalidatePath('/home')` でキャッシュ更新

## 備考
- `params` / `searchParams` は `await` で取得
- 目標は複数同時に持てる
