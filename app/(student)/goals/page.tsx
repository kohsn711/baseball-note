import Link from 'next/link'
import {
  fetchGoalsByStatus,
  GOAL_CATEGORY_LABEL,
  GOAL_STATUSES,
  GOAL_STATUS_LABEL,
  type GoalStatus,
} from '@/lib/goals'
import { requireRole } from '@/lib/current-user'
import { PageHeader } from '@/components/page-header'
import { StatusButtons } from './status-buttons'

export const metadata = {
  title: '目標 | 野球ノート',
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const status: GoalStatus = (GOAL_STATUSES as readonly string[]).includes(statusParam ?? '')
    ? (statusParam as GoalStatus)
    : 'active'

  const profile = await requireRole('student')

  const goals = await fetchGoalsByStatus(profile.id, status)

  return (
    <>
      <PageHeader>
        <h1 className="text-base font-semibold text-slate-900">目標</h1>
        <Link
          href="/goals/new"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          新規作成
        </Link>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">

      <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
        {GOAL_STATUSES.map((s) => {
          const active = s === status
          return (
            <Link
              key={s}
              href={`/goals?status=${s}`}
              className={`flex-1 rounded-md py-1.5 text-center ${
                active
                  ? 'bg-white font-medium text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {GOAL_STATUS_LABEL[s]}
            </Link>
          )
        })}
      </nav>

      {goals.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
          {status === 'active'
            ? 'まだ目標が設定されていません。'
            : `「${GOAL_STATUS_LABEL[status]}」の目標はありません。`}
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => (
            <li key={g.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 break-words">
                    {g.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {GOAL_CATEGORY_LABEL[g.category]}
                    {g.targetDate && ` ・ 期限 ${g.targetDate}`}
                  </p>
                </div>
                <Link
                  href={`/goals/${g.id}/edit`}
                  className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                >
                  編集
                </Link>
              </div>
              <StatusButtons goalId={g.id} status={g.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  )
}
