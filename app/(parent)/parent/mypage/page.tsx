import Link from 'next/link'
import { requireRole } from '@/lib/current-user'
import { PageHeader } from '@/components/page-header'
import { SignOutButton } from '@/components/sign-out-button'

export default async function ParentMyPage() {
  const profile = await requireRole('parent')

  return (
    <>
      <PageHeader>
        <h1 className="text-base font-semibold text-slate-900">マイページ</h1>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-6 px-4 py-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">表示名</p>
        <p className="text-base font-semibold text-slate-900">
          {profile.displayName || '—'}
        </p>
        <p className="mt-3 text-sm text-slate-500">メールアドレス</p>
        <p className="break-all text-sm text-slate-700">{profile.email}</p>
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
