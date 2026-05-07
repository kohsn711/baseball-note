import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { TeamCreateForm } from './team-create-form'

export const metadata = {
  title: 'チーム作成 | 野球ノート',
}

export default async function CreateTeamPage() {
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
  if (profile.role !== 'coach') redirect('/login')

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
