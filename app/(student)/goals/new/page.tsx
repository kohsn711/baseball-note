import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { GoalForm } from '../goal-form'
import { createGoal } from '../actions'

export const metadata = {
  title: '目標を新規作成 | 野球ノート',
}

export default async function NewGoalPage() {
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
        <Link href="/goals" className="text-sm text-slate-500">
          ← 目標一覧
        </Link>
      </header>
      <h1 className="text-lg font-semibold text-slate-900">目標を新規作成</h1>
      <GoalForm
        action={createGoal}
        defaults={{ title: '', description: '', category: 'general', target_date: '' }}
        submitLabel="作成する"
      />
    </div>
  )
}
