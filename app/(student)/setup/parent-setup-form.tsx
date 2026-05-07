'use client'

import { useActionState } from 'react'
import { completeParentSetup, type ParentSetupState } from './parent-actions'

export const ParentSetupForm = () => {
  const [state, formAction, pending] = useActionState<ParentSetupState, FormData>(
    completeParentSetup,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="display_name" className="block text-sm font-medium text-slate-700">
          お名前 <span className="text-red-600">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          placeholder="山田 花子"
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
        {pending ? '保存中…' : '設定完了'}
      </button>
    </form>
  )
}
