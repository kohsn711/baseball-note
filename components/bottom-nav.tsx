'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Role = 'student' | 'parent' | 'coach'

type Tab = {
  href: string
  label: string
  icon: string
  matchPaths?: string[]
}

const TABS: Record<Role, Tab[]> = {
  student: [
    { href: '/home', label: '記録', icon: '📝', matchPaths: ['/home', '/records'] },
    { href: '/goals', label: '目標', icon: '🎯', matchPaths: ['/goals'] },
    { href: '/contents', label: 'コンテンツ', icon: '📖', matchPaths: ['/contents'] },
    { href: '/mypage', label: 'マイページ', icon: '👤', matchPaths: ['/mypage', '/settings'] },
  ],
  parent: [
    { href: '/parent', label: 'お子さま', icon: '👨‍👩‍👧', matchPaths: ['/parent'] },
    { href: '/parent/contents', label: 'コンテンツ', icon: '📖', matchPaths: ['/parent/contents'] },
    { href: '/parent/mypage', label: 'マイページ', icon: '👤', matchPaths: ['/parent/mypage', '/parent/links'] },
  ],
  coach: [
    { href: '/coach', label: '選手', icon: '👥', matchPaths: ['/coach', '/coach/students'] },
    { href: '/coach/contents', label: 'コンテンツ', icon: '📖', matchPaths: ['/coach/contents'] },
    { href: '/coach/mypage', label: 'マイページ', icon: '👤', matchPaths: ['/coach/mypage', '/coach/team'] },
  ],
}

const HIDE_PREFIXES = ['/login', '/setup']

const matchScore = (pathname: string, paths: string[]): number => {
  let best = -1
  for (const p of paths) {
    if (pathname === p || pathname.startsWith(p + '/')) {
      if (p.length > best) best = p.length
    }
  }
  return best
}

export const BottomNav = ({ role }: { role: Role }) => {
  const pathname = usePathname() ?? ''
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null
  }

  const tabs = TABS[role]
  const scores = tabs.map((t) => matchScore(pathname, t.matchPaths ?? [t.href]))
  const activeIndex = scores.reduce(
    (best, s, i) => (s > scores[best] ? i : best),
    0
  )
  const hasActive = scores[activeIndex] >= 0

  return (
    <nav
      aria-label="メインナビゲーション"
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/97 shadow-[0_-1px_12px_rgba(0,0,0,0.06)] backdrop-blur"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {tabs.map((tab, i) => {
          const active = hasActive && i === activeIndex
          return (
            <li key={tab.href} className="relative flex-1">
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-orange-500" />
              )}
              <Link
                href={tab.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
                  active ? 'text-orange-500' : 'text-slate-400'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className={active ? 'font-bold' : 'font-medium'}>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
