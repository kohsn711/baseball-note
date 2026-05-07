'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDE_PREFIXES = ['/login', '/setup', '/notifications']

export const HeaderBell = ({ unreadCount }: { unreadCount: number }) => {
  const pathname = usePathname() ?? ''
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null
  }

  return (
    <Link
      href="/notifications"
      aria-label={`通知 ${unreadCount > 0 ? `(未読${unreadCount}件)` : ''}`}
      className="fixed right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-slate-200"
    >
      <span aria-hidden>🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
