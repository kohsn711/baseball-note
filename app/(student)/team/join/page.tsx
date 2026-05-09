import Link from 'next/link'
import { requireRole } from '@/lib/current-user'
import { TeamJoinForm } from './team-join-form'

export const metadata = {
  title: 'チームに参加 | 野球ノート',
}

export default async function JoinTeamPage() {
  await requireRole('student')

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header>
        <Link href="/home" className="text-sm text-slate-500">
          ← ホーム
        </Link>
      </header>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">チームに参加</h1>
        <p className="text-sm text-slate-600">
          監督から共有されたチームコードを入力すると、所属チームとして登録されます。
        </p>
      </div>
      <TeamJoinForm />
    </div>
  )
}
