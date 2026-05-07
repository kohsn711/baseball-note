export default function ParentChildLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  )
}
