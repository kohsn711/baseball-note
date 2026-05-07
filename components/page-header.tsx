export const PageHeader = ({ children }: { children: React.ReactNode }) => (
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex min-h-10 max-w-md items-center justify-between gap-3">
      {children}
    </div>
  </header>
)
