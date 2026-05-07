export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-4 py-6">
      <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
      <div className="flex gap-2">
        <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
