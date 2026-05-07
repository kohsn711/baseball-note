'use client'

import Link from 'next/link'

export default function ParentChildError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10 text-center">
      <h1 className="text-base font-semibold text-slate-900">
        お子さまの情報を読み込めませんでした
      </h1>
      <p className="text-sm text-slate-600">
        通信状況を確認してもう一度お試しください。
      </p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          再試行
        </button>
        <Link
          href="/parent"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300"
        >
          保護者ホーム
        </Link>
      </div>
    </div>
  )
}
