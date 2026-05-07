import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getJstParts, calculateStreak } from '@/lib/date-jst'
import { getDailyMessage } from '@/lib/messages'
import {
  fetchMonthlyRecordedDates,
  fetchRecentFeedback,
  fetchRecentRecordedDates,
  isTodayRecorded,
} from '@/lib/student-home'
import { fetchTeamsForUser } from '@/lib/team'
import { countUnreadNotifications } from '@/lib/notifications'
import { PageHeader } from '@/components/page-header'
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

  const [todayRecorded, monthlyDates, recentDates, feedback, teams, unreadCount] =
    await Promise.all([
      isTodayRecorded(userId, todayIso),
      fetchMonthlyRecordedDates(userId, today.year, today.month),
      fetchRecentRecordedDates(userId),
      fetchRecentFeedback(userId),
      fetchTeamsForUser(userId),
      countUnreadNotifications(userId),
    ])

  const streak = calculateStreak(recentDates)
  const message = getDailyMessage(todayIso)

  return (
    <>
      <PageHeader>
        <div>
          <p className="text-xs text-slate-500">こんにちは</p>
          <p className="text-base font-semibold text-slate-900">{profile.display_name} さん</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {teams.length > 0 && (
            <p className="text-xs text-slate-500">{teams.map((t) => t.name).join(' / ')}</p>
          )}
          <Link
            href="/notifications"
            aria-label={`通知${unreadCount > 0 ? ` (未読${unreadCount}件)` : ''}`}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
      {teams.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          まだチームに所属していません。
          <Link href="/team/join" className="ml-1 underline">チームに参加する</Link>
        </p>
      )}

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

      </div>
    </>
  )
}
