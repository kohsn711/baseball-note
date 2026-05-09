import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchGoalById } from '@/lib/goals'
import { requireRole } from '@/lib/current-user'
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

  const profile = await requireRole('student')

  const goal = await fetchGoalById(id, profile.id)
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
