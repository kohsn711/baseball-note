# 07 今日の記録作成・編集

## 概要
学生が1日1回記録を入力するメイン機能。6カテゴリのタブ形式で入力。

## ToDo

### 画面（`app/(student)/records/[date]/page.tsx`）
- [x] カテゴリタブUI（practice / training / meal / condition / injury / reflection）
- [x] 未入力カテゴリがあっても「保存」できる設計
- [x] 既存記録がある場合は編集モードで表示
- [x] 既存記録取得は `daily_records` から子テーブルをネストselectで一括取得

### カテゴリ別入力フォーム

**practice（練習）**
- [x] 素振り: 回数入力
- [x] ティー打撃: 回数入力
- [x] キャッチボール: 分入力
- [x] 投球練習: 球数入力
- [x] 守備練習: 分入力
- [x] 走塁練習: 分入力
- [x] 自由メモ: テキスト入力

**training（体づくり）**
- [x] ランニング: km または 分入力
- [x] ダッシュ: 本数入力
- [x] 腕立て: 回数入力
- [x] 腹筋: 回数入力
- [x] スクワット: 回数入力
- [x] ストレッチ: 分入力
- [x] 自由メモ: テキスト入力

**meal（食事）**
- [x] 朝食: ate / skipped 選択
- [x] 昼食: ate / skipped 選択
- [x] 夕食: ate / skipped 選択
- [x] 補食: ate / skipped 選択
- [x] 水分: low / normal / high 選択
- [x] 食事メモ: テキスト入力

**condition（睡眠・体調）**
- [x] 睡眠時間: 数値入力
- [x] 起床時刻: 時刻入力
- [x] 就寝時刻: 時刻入力
- [x] 体重: 数値入力
- [x] 体調: good / normal / bad 選択

**injury（ケガ・痛み）**
- [x] 痛みの有無: トグル
- [x] 部位選択: shoulder / elbow / wrist / back / hip / knee / ankle / thigh / calf / other
- [x] 痛みレベル: 1〜5 選択
- [x] 練習への影響: none / little / serious 選択
- [x] メモ: テキスト入力

**reflection（日記・振り返り）**
- [x] 今日できたこと: テキスト入力
- [x] 課題・反省: テキスト入力
- [x] 明日やること: テキスト入力
- [x] 今日の気分: 1〜5 選択

### Server Action
- [x] `daily_records` の upsert（当日レコードがなければ作成、あれば更新）
- [x] 各カテゴリの子テーブルに upsert
- [x] 保存後に `revalidatePath()` で当日ページとホームを更新し、画面上に保存時刻を返す
- [x] Server Action内で認証チェック・本人確認

## 備考
- 必須入力を増やしすぎない。すべてのフィールドはオプション
- 数値・選択・チェック式を中心にする
- `params` は `await params` で取得（Promiseのため）
- 認証・ロール確認は `requireRole('student')` を使う
