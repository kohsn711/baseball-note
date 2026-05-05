'use client'

import { useActionState } from 'react'
import { verifyOtp, type ActionState } from '../actions'

export const VerifyForm = ({ email }: { email: string }) => {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    verifyOtp,
    undefined
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />

      <div className="space-y-1">
        <label htmlFor="token" className="block text-sm font-medium text-slate-700">
          認証コード（6桁）
        </label>
        <input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          placeholder="123456"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-slate-500 focus:outline-none"
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
        {pending ? '確認中…' : 'ログインする'}
      </button>
    </form>
  )
}
