'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationsRead } from './actions'

type Props = {
  enabled: boolean
}

export const MarkReadOnView = ({ enabled }: Props) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const firedRef = useRef(false)

  useEffect(() => {
    if (!enabled || pending || firedRef.current) return
    firedRef.current = true

    startTransition(async () => {
      await markNotificationsRead()
      router.refresh()
    })
  }, [enabled, pending, router])

  return null
}
