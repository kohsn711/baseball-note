'use client'

import { useActionState } from 'react'
import { sendOtp, type ActionState } from './actions'

export const LoginForm = () => {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendOtp,
    undefined
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
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
        {pending ? '送信中…' : '認証コードを送る'}
      </button>
    </form>
  )
}
