import Link from 'next/link'
import { fetchParentChildren } from '@/lib/parent'
import { requireRole } from '@/lib/current-user'
import { PageHeader } from '@/components/page-header'

export const metadata = {
  title: '保護者ホーム | 野球ノート',
}

export default async function ParentHomePage() {
  const profile = await requireRole('parent')

  const children = await fetchParentChildren(profile.id)

  return (
    <>
      <PageHeader>
        <div>
          <p className="text-xs text-slate-500">保護者</p>
          <p className="text-base font-semibold text-slate-900">{profile.displayName} さん</p>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">お子さま</h2>
        {children.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだ連携しているお子さまはいません。
          </p>
        ) : (
          <ul className="space-y-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/parent/children/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {c.displayName || '（名前未設定）'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      最終記録：{c.lastRecordDate ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">連続</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.streak}日
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </>
  )
}
