'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOtp, type ActionState } from './actions'

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const LoginForm = () => {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [hasCodeError, setHasCodeError] = useState<string | null>(null)

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendOtp,
    undefined
  )

  const goToVerify = () => {
    setHasCodeError(null)
    const emailInput = formRef.current?.elements.namedItem('email') as
      | HTMLInputElement
      | null
    const email = emailInput?.value.trim() ?? ''
    if (!isValidEmail(email)) {
      setHasCodeError('メールアドレスを入力してください。')
      return
    }
    router.push(`/login/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
      {hasCodeError && (
        <p className="text-sm text-red-600" role="alert">
          {hasCodeError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '送信中…' : '認証コードを送る'}
      </button>

      <p className="text-center text-sm">
        <button
          type="button"
          onClick={goToVerify}
          className="text-slate-600 underline"
        >
          認証コードを受け取り済みの方はこちら
        </button>
      </p>
    </form>
  )
}
