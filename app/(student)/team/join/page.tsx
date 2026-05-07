import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { TeamJoinForm } from './team-join-form'

export const metadata = {
  title: 'チームに参加 | 野球ノート',
}

export default async function JoinTeamPage() {
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
