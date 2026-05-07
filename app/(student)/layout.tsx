import { BottomNav } from '@/components/bottom-nav'

export const dynamic = 'force-dynamic'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 pb-nav">
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav role="student" />
    </div>
  )
}
