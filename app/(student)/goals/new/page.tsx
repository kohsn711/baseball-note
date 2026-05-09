import Link from 'next/link'
import { requireRole } from '@/lib/current-user'
import { GoalForm } from '../goal-form'
import { createGoal } from '../actions'

export const metadata = {
  title: '目標を新規作成 | 野球ノート',
}

export default async function NewGoalPage() {
  await requireRole('student')

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
