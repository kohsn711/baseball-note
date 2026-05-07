import { BottomNav } from '@/components/bottom-nav'

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 pb-nav">
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav role="coach" />
    </div>
  )
}
