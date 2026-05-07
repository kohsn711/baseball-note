'use client'

import { useActionState } from 'react'
import { createTeam, type CreateTeamState } from './actions'

export const TeamCreateForm = () => {
  const [state, formAction, pending] = useActionState<CreateTeamState, FormData>(
    createTeam,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          チーム名 <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          placeholder="〇〇中学校 野球部"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '作成中…' : 'チームを作成する'}
      </button>
    </form>
  )
}
