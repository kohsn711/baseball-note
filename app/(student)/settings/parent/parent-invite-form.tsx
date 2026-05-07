'use client'

import { useActionState } from 'react'
import { inviteParent, type InviteParentState } from './actions'

export const ParentInviteForm = () => {
  const [state, formAction, pending] = useActionState<InviteParentState, FormData>(
    inviteParent,
    undefined
  )

  return (
    <form action={formAction} className="space-y-4" key={state?.success ?? 'form'}>
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          保護者のメールアドレス <span className="text-red-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="parent@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">
          保護者はこのメールに届く認証コードでログインし、招待を承認すると記録を閲覧できるようになります。
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '送信中…' : '招待メールを送る'}
      </button>
    </form>
  )
}
