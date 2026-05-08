import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/page-header'
import { SignOutButton } from '@/components/sign-out-button'

export default async function ParentMyPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const email = (claimsData?.claims?.email as string | undefined) ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()

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
      </section>

      <nav className="space-y-2">
        <Link
          href="/parent/links"
          className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">招待・連携</p>
            <p className="text-xs text-slate-500">お子さまとの連携状況を確認</p>
          </div>
          <span className="text-slate-400">›</span>
        </Link>
      </nav>

      <SignOutButton />
    </div>
    </>
  )
}
