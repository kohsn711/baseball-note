'use client'

export default function CoachDashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10 text-center">
      <h1 className="text-base font-semibold text-slate-900">
        ダッシュボードの読み込みに失敗しました
      </h1>
      <p className="text-sm text-slate-600">
        通信状況を確認してもう一度お試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        再試行
      </button>
    </div>
  )
}
