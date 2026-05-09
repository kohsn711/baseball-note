import Link from 'next/link'
import { requireRole } from '@/lib/current-user'
import { TeamCreateForm } from './team-create-form'

export const metadata = {
  title: 'チーム作成 | 野球ノート',
}

export default async function CreateTeamPage() {
  await requireRole('coach')

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header>
        <Link href="/coach" className="text-sm text-slate-500">
          ← ダッシュボード
        </Link>
      </header>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">チームを作成</h1>
        <p className="text-sm text-slate-600">
          作成すると6文字のチームコードが発行されます。学生にコードを伝えて参加してもらいます。
        </p>
      </div>
      <TeamCreateForm />
    </div>
  )
}
