'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'pwa-install-card-dismissed'

const isIosSafari = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(userAgent)
  const isWebkit = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent)
  return isIos && isWebkit
}

const isStandaloneMode = () => {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

export const PwaInstallCard = () => {
  const pathname = usePathname() ?? ''
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      window.localStorage.removeItem(DISMISS_KEY)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const shouldHideForPath =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname === '/setup' ||
    pathname.startsWith('/setup/')

  const storedDismissed =
    isClient && window.localStorage.getItem(DISMISS_KEY) === '1'
  const isInstalled = installed || (isClient && isStandaloneMode())
  const iosSafari = isClient && isIosSafari()

  if (
    shouldHideForPath ||
    !isClient ||
    dismissed ||
    storedDismissed ||
    isInstalled ||
    (!iosSafari && !deferredPrompt)
  ) {
    return null
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setInstalled(true)
      window.localStorage.removeItem(DISMISS_KEY)
    }

    if (outcome === 'dismissed') {
      window.localStorage.setItem(DISMISS_KEY, '1')
      setDismissed(true)
    }

    setDeferredPrompt(null)
  }

  return (
    <section className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">ホーム画面に追加</p>
          <p className="text-xs leading-5 text-slate-600">
            野球ノートをアプリのように開けます。起動が速くなり、ブラウザのタブを開かずに使えます。
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white hover:text-slate-600"
          aria-label="閉じる"
        >
          閉じる
        </button>
      </div>

      {deferredPrompt ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">この端末ではそのまま追加できます。</p>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            追加する
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
          <p>iPhone / iPad では Safari の共有メニューから追加してください。</p>
          <p>手順: 共有ボタン → 「ホーム画面に追加」 → 「追加」</p>
        </div>
      )}
    </section>
  )
}
