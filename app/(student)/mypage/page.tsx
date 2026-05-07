import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/page-header'
import { SignOutButton } from '@/components/sign-out-button'

export default async function StudentMyPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const email = (claimsData?.claims?.email as string | undefined) ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userId)
    .maybeSingle()

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id, teams(name)')
    .eq('user_id', userId)
    .maybeSingle()

  const teamRel = teamMember?.teams as { name: string } | { name: string }[] | null | undefined
  const teamName = (Array.isArray(teamRel) ? teamRel[0]?.name : teamRel?.name) ?? null

  return (
    <>
      <PageHeader>
        <h1 className="text-base font-semibold text-slate-900">マイページ</h1>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-6 px-4 py-4">

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">表示名</p>
        <p className="text-base font-semibold text-slate-900">
          {profile?.display_name ?? '—'}
        </p>
        <p className="mt-3 text-sm text-slate-500">メールアドレス</p>
        <p className="break-all text-sm text-slate-700">{email}</p>
        <p className="mt-3 text-sm text-slate-500">所属チーム</p>
        <p className="text-sm text-slate-700">{teamName ?? '未参加'}</p>
      </section>

      <nav className="space-y-2">
        <MyPageLink href="/notifications" title="通知" desc="リアクション・コメントの履歴" />
        <MyPageLink href="/settings/parent" title="保護者の登録・管理" desc="保護者を招待・解除" />
        {!teamName && (
          <MyPageLink href="/team/join" title="チームに参加" desc="チームコードで参加" />
        )}
      </nav>

      <SignOutButton />
    </div>
    </>
  )
}

const MyPageLink = ({
  href,
  title,
  desc,
}: {
  href: string
  title: string
  desc: string
}) => (
  <Link
    href={href}
    className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"
  >
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <span className="text-slate-400">›</span>
  </Link>
)
