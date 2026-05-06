'use client'

import { useTransition } from 'react'
import { changeGoalStatus } from './actions'
import type { GoalStatus } from '@/lib/goals-constants'

type Props = {
  goalId: string
  status: GoalStatus
}

export const StatusButtons = ({ goalId, status }: Props) => {
  const [pending, startTransition] = useTransition()

  const change = (next: GoalStatus) => {
    startTransition(async () => {
      await changeGoalStatus(goalId, next)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'active' ? (
        <>
          <button
            type="button"
            onClick={() => change('achieved')}
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            達成
          </button>
          <button
            type="button"
            onClick={() => change('abandoned')}
            disabled={pending}
            className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 disabled:opacity-50"
          >
            断念
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => change('active')}
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          再開
        </button>
      )}
    </div>
  )
}
