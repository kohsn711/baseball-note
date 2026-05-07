export const PageHeader = ({ children }: { children: React.ReactNode }) => (
  <header className="sticky top-0 z-20 bg-white/97 px-4 py-3 shadow-sm backdrop-blur">
    <div className="mx-auto flex min-h-10 max-w-md items-center justify-between gap-3">
      {children}
    </div>
    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-60" />
  </header>
)
