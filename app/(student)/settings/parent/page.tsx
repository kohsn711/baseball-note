import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ParentInviteForm } from './parent-invite-form'
import { cancelParentInvite } from './actions'

export const metadata = {
  title: '保護者の登録 | 野球ノート',
}

type LinkRow = {
  id: string
  parent_id: string | null
  invited_email: string | null
  status: 'pending' | 'active'
  created_at: string
}

export default async function ParentInvitePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.role) redirect('/setup')
  if (profile.role !== 'student') redirect('/login')

  const { data: links } = await supabase
    .from('parent_child_links')
    .select('id, parent_id, invited_email, status, created_at')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .returns<LinkRow[]>()

  const parentIds = (links ?? [])
    .map((l) => l.parent_id)
    .filter((v): v is string => Boolean(v))

  const parentNameMap = new Map<string, string>()
  if (parentIds.length > 0) {
    const { data: parents } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', parentIds)
    parents?.forEach((p) => parentNameMap.set(p.id, p.display_name))
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header>
        <Link href="/home" className="text-sm text-slate-500">
          ← ホーム
        </Link>
      </header>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">保護者を登録する</h1>
        <p className="text-sm text-slate-600">
          保護者のメールアドレスを登録すると、保護者は自分の記録を閲覧できるようになります。
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <ParentInviteForm />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">登録済みの保護者</h2>
        {!links || links.length === 0 ? (
          <p className="text-sm text-slate-500">まだ登録された保護者はいません。</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm text-slate-900">
                    {link.parent_id
                      ? parentNameMap.get(link.parent_id) ?? '保護者'
                      : link.invited_email}
                  </p>
                  <p className="text-xs text-slate-500">
                    {link.status === 'active' ? '承認済み' : '承認待ち'}
                  </p>
                </div>
                <form action={cancelParentInvite}>
                  <input type="hidden" name="link_id" value={link.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline"
                  >
                    {link.status === 'active' ? '解除' : '取り消し'}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
