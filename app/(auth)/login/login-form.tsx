'use client'

import { useState, useActionState } from 'react'
import { signInWithPassword, sendLoginOtp, verifyLoginOtp, type ActionState } from './actions'

const PasswordForm = () => {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signInWithPassword,
    undefined
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="pw-email" className="block text-sm font-medium text-slate-700">
          メールアドレス
        </label>
        <input
          id="pw-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="pw-password" className="block text-sm font-medium text-slate-700">
          パスワード
        </label>
        <input
          id="pw-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
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
        {pending ? 'ログイン中…' : 'ログインする'}
      </button>
    </form>
  )
}

const OtpForm = () => {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (prev, fd) => {
      const hasStep = fd.get('_step') === 'verify'
      return hasStep ? verifyLoginOtp(prev, fd) : sendLoginOtp(prev, fd)
    },
    undefined
  )

  const isOtpStep = state && 'step' in state && state.step === 'otp'

  return (
    <form action={formAction} className="space-y-4">
      {isOtpStep && (
        <input type="hidden" name="_step" value="verify" />
      )}

      <div className="space-y-1">
        <label htmlFor="otp-email" className="block text-sm font-medium text-slate-700">
          メールアドレス
        </label>
        <input
          id="otp-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          readOnly={isOtpStep}
          defaultValue={isOtpStep ? state.email : undefined}
          placeholder="you@example.com"
          className={`w-full rounded-lg border px-3 py-2 text-base focus:outline-none ${
            isOtpStep
              ? 'border-slate-200 bg-slate-50 text-slate-500'
              : 'border-slate-300 focus:border-slate-500'
          }`}
        />
      </div>

      {isOtpStep && (
        <div className="space-y-1">
          <label htmlFor="otp-token" className="block text-sm font-medium text-slate-700">
            認証コード
          </label>
          <input
            id="otp-token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xl tracking-widest focus:border-slate-500 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            {state.email} に送信された6桁のコードを入力してください。
          </p>
        </div>
      )}

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
        {pending
          ? '送信中…'
          : isOtpStep
          ? 'ログインする'
          : '認証コードを送信'}
      </button>
    </form>
  )
}

export const LoginForm = () => {
  const [tab, setTab] = useState<'password' | 'otp'>('password')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(['password', 'otp'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'password' ? 'パスワード' : '認証コード'}
          </button>
        ))}
      </div>

      {tab === 'password' ? <PasswordForm /> : <OtpForm />}

      {tab === 'otp' && (
        <p className="text-center text-xs text-slate-500">
          保護者の方は「認証コード」でログインしてください。
        </p>
      )}
    </div>
  )
}
