import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { approveParentLink, rejectParentLink } from './actions'

export const metadata = {
  title: '招待・連携 | 野球ノート',
}

type LinkRow = {
  id: string
  parent_id: string | null
  student_id: string
  invited_email: string | null
  status: 'pending' | 'active'
  created_at: string
}

export default async function ParentLinksPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined) ?? null
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.role) redirect('/setup')
  if (profile.role !== 'parent') redirect('/login')

  const [activeRes, pendingRes] = await Promise.all([
    supabase
      .from('parent_child_links')
      .select('id, parent_id, student_id, invited_email, status, created_at')
      .eq('parent_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .returns<LinkRow[]>(),
    userEmail
      ? supabase
          .from('parent_child_links')
          .select('id, parent_id, student_id, invited_email, status, created_at')
          .eq('status', 'pending')
          .is('parent_id', null)
          .eq('invited_email', userEmail.toLowerCase())
          .order('created_at', { ascending: false })
          .returns<LinkRow[]>()
      : Promise.resolve({ data: [] as LinkRow[] }),
  ])

  const pending = pendingRes.data ?? []
  const active = activeRes.data ?? []

  const studentIds = [...pending, ...active].map((l) => l.student_id)
  const nameMap = new Map<string, string>()
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', studentIds)
    students?.forEach((s) => nameMap.set(s.id, s.display_name))
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header>
        <Link href="/parent" className="text-sm text-slate-500">
          ← 保護者ホーム
        </Link>
      </header>
      <h1 className="text-lg font-semibold text-slate-900">招待・連携</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">承認待ちの招待</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">承認待ちの招待はありません。</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((link) => (
              <li key={link.id} className="rounded-lg border border-slate-200 px-3 py-3">
                <p className="text-sm text-slate-900">
                  {nameMap.get(link.student_id) ?? '学生'} さんからの招待
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  承認するとお子さまの記録を閲覧できます。
                </p>
                <div className="mt-3 flex gap-2">
                  <form action={approveParentLink} className="flex-1">
                    <input type="hidden" name="link_id" value={link.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white"
                    >
                      承認する
                    </button>
                  </form>
                  <form action={rejectParentLink} className="flex-1">
                    <input type="hidden" name="link_id" value={link.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700"
                    >
                      拒否する
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">連携中のお子さま</h2>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">まだ連携しているお子さまはいません。</p>
        ) : (
          <ul className="space-y-2">
            {active.map((link) => (
              <li
                key={link.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                {nameMap.get(link.student_id) ?? '学生'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
