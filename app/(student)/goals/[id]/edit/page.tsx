import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { fetchGoalById } from '@/lib/goals'
import { GoalForm } from '../../goal-form'
import { updateGoal } from '../../actions'

export const metadata = {
  title: '目標を編集 | 野球ノート',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

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

  const goal = await fetchGoalById(id, userId)
  if (!goal) notFound()

  const action = updateGoal.bind(null, goal.id)

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header>
        <Link href="/goals" className="text-sm text-slate-500">
          ← 目標一覧
        </Link>
      </header>
      <h1 className="text-lg font-semibold text-slate-900">目標を編集</h1>
      <GoalForm
        action={action}
        defaults={{
          title: goal.title,
          description: goal.description ?? '',
          category: goal.category,
          target_date: goal.targetDate ?? '',
        }}
        submitLabel="保存する"
      />
    </div>
  )
}
