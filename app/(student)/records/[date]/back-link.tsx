'use client'

import Link from 'next/link'
import type { MouseEvent, ReactNode } from 'react'
import { isDirty } from './dirty-store'

export const BackLink = ({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) => {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty()) return
    const ok = window.confirm('保存していない変更があります。このページを離れますか？')
    if (!ok) e.preventDefault()
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
