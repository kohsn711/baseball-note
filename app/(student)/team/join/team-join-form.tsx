'use client'

import { useActionState } from 'react'
import { joinTeam, type JoinTeamState } from './actions'

export const TeamJoinForm = () => {
  const [state, formAction, pending] = useActionState<JoinTeamState, FormData>(
    joinTeam,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="team_code" className="block text-sm font-medium text-slate-700">
          チームコード <span className="text-red-600">*</span>
        </label>
        <input
          id="team_code"
          name="team_code"
          type="text"
          required
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={8}
          placeholder="例: ABC234"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-widest uppercase focus:border-slate-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">監督から共有されたコードを入力してください。</p>
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
        {pending ? '参加処理中…' : 'チームに参加する'}
      </button>
    </form>
  )
}
