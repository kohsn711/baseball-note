'use client'

import { useActionState } from 'react'
import { completeSetup, type SetupActionState } from './actions'

const GRADES = ['中1', '中2', '中3', '高1', '高2', '高3'] as const
const POSITIONS = ['投手', '捕手', '内野手', '外野手', 'その他'] as const

export const SetupForm = () => {
  const [state, formAction, pending] = useActionState<SetupActionState, FormData>(
    completeSetup,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="display_name" className="block text-sm font-medium text-slate-700">
          氏名 <span className="text-red-600">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          placeholder="山田 太郎"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
          学年
        </label>
        <select
          id="grade"
          name="grade"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        >
          <option value="">選択しない</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="position" className="block text-sm font-medium text-slate-700">
          ポジション
        </label>
        <select
          id="position"
          name="position"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        >
          <option value="">選択しない</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
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
        {pending ? '保存中…' : '設定完了'}
      </button>
    </form>
  )
}
