import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getJstParts, calculateStreak } from '@/lib/date-jst'
import { getDailyMessage } from '@/lib/messages'
import {
  fetchActiveGoals,
  fetchMonthlyRecordedDates,
  fetchRecentFeedback,
  fetchRecentRecordedDates,
  isTodayRecorded,
} from '@/lib/student-home'
import { fetchTeamsForUser } from '@/lib/team'
import { countUnreadNotifications } from '@/lib/notifications'
import { Calendar } from './calendar'

export const metadata = {
  title: 'ホーム | 野球ノート',
}

export default async function StudentHome() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) redirect('/setup')

  const today = getJstParts()
  const todayIso = today.iso

  const [todayRecorded, monthlyDates, recentDates, feedback, goals, teams, unreadCount] =
    await Promise.all([
      isTodayRecorded(userId, todayIso),
      fetchMonthlyRecordedDates(userId, today.year, today.month),
      fetchRecentRecordedDates(userId),
      fetchRecentFeedback(userId),
      fetchActiveGoals(userId),
      fetchTeamsForUser(userId),
      countUnreadNotifications(userId),
    ])

  const streak = calculateStreak(recentDates)
  const message = getDailyMessage(todayIso)

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">こんにちは</p>
            <h1 className="text-lg font-semibold text-slate-900">
              {profile.display_name} さん
            </h1>
          </div>
          <Link
            href="/notifications"
            className="relative inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
            aria-label={`通知 ${unreadCount > 0 ? `(未読${unreadCount}件)` : ''}`}
          >
            <span>🔔</span>
            <span>通知</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
        {teams.length === 0 ? (
          <p className="text-xs text-slate-500">
            まだチームに所属していません。
            <Link href="/team/join" className="ml-1 underline">
              チームに参加する
            </Link>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            所属チーム: {teams.map((t) => t.name).join(' / ')}
            <Link href="/team/join" className="ml-2 underline">
              追加で参加
            </Link>
          </p>
        )}
      </header>

      {/* 1. 今日の記録ボタン */}
      <Link
        href="/records/today"
        className={`block rounded-2xl px-4 py-4 text-center text-base font-semibold shadow-sm ${
          todayRecorded
            ? 'bg-white text-slate-900 ring-1 ring-slate-200'
            : 'bg-slate-900 text-white'
        }`}
      >
        {todayRecorded ? '今日の記録を編集する' : '今日の記録をつける'}
      </Link>

      {/* 2. 今日のひとこと */}
      <section className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="text-xs font-medium text-amber-700">今日のひとこと</p>
        <p className="mt-1">{message}</p>
      </section>

      {/* 3. カレンダー */}
      <Calendar
        initialYear={today.year}
        initialMonth0={today.month}
        todayIso={todayIso}
        recordedDates={[...monthlyDates]}
      />

      {/* 4. 連続記録日数 */}
      <section className="rounded-2xl bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-500">連続記録日数</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {streak}
          <span className="ml-1 text-sm font-normal text-slate-500">日</span>
        </p>
      </section>

      {/* 5. 最近のリアクション/コメント */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">最近のリアクション・コメント</h2>
        {feedback.length === 0 ? (
          <p className="text-sm text-slate-500">まだ届いていません。</p>
        ) : (
          <ul className="space-y-2">
            {feedback.map((f) => (
              <li
                key={`${f.kind}-${f.id}`}
                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-base">{f.kind === 'reaction' ? f.text : '💬'}</span>
                <div className="min-w-0 flex-1">
                  {f.kind === 'comment' && (
                    <p className="truncate text-slate-800">{f.text}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {f.senderName} ・ {f.recordDate} の記録に
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* コンテンツ */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">コンテンツ</h2>
            <p className="text-xs text-slate-500">記事や動画を見る</p>
          </div>
          <Link
            href="/contents"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            一覧を見る
          </Link>
        </div>
      </section>

      {/* 保護者の登録 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">保護者の登録</h2>
            <p className="text-xs text-slate-500">
              保護者を招待すると記録を見てもらえます。
            </p>
          </div>
          <Link
            href="/settings/parent"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            管理する
          </Link>
        </div>
      </section>

      {/* 6. 目標進捗 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">目標</h2>
          <Link href="/goals" className="text-xs text-slate-500 underline">
            すべて見る
          </Link>
        </div>
        {goals.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだ目標が設定されていません。
            <Link href="/goals/new" className="ml-1 underline">
              設定する
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{g.title}</p>
                <p className="text-xs text-slate-500">
                  {g.category}
                  {g.targetDate && ` ・ 目標日 ${g.targetDate}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
