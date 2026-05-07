import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchNotifications } from '@/lib/notifications'
import { PageHeader } from '@/components/page-header'

export const metadata = {
  title: '通知 | 野球ノート',
}

const formatJst = (iso: string): string => {
  const d = new Date(iso)
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(jst.getUTCDate()).padStart(2, '0')
  const hh = String(jst.getUTCHours()).padStart(2, '0')
  const mm = String(jst.getUTCMinutes()).padStart(2, '0')
  return `${jst.getUTCFullYear()}/${m}/${day} ${hh}:${mm}`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.role !== 'student') redirect('/login')

  const items = await fetchNotifications(userId)

  const hasUnread = items.some((n) => !n.isRead)
  if (hasUnread) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    // 学生 layout のヘッダーベル未読数を再計算させる
    revalidatePath('/', 'layout')
  }

  return (
    <>
      <PageHeader>
        <h1 className="text-base font-semibold text-slate-900">通知</h1>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-3 px-4 py-4">

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
          通知はまだありません。
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const href = n.recordDate ? `/records/${n.recordDate}/detail` : null
            const inner = (
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  n.isRead ? 'bg-white' : 'bg-amber-50 ring-1 ring-amber-200'
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="text-lg">
                    {n.type === 'reaction' ? n.body ?? '👏' : '💬'}
                  </span>
                  <span className="flex-1">{n.title}</span>
                  {!n.isRead && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">
                      新着
                    </span>
                  )}
                </p>
                {n.type !== 'reaction' && n.body && (
                  <p className="mt-1 truncate text-sm text-slate-700">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {formatJst(n.createdAt)}
                  {n.recordDate && ` ・ ${n.recordDate} の記録`}
                </p>
              </div>
            )
            return (
              <li key={n.id}>
                {href ? (
                  <Link href={href} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
    </>
  )
}
