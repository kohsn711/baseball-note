import type { Metadata, Viewport } from 'next'
import { PwaInstallCard } from '@/components/pwa-install-card'
import {
  PWA_APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_THEME_COLOR,
} from '@/lib/pwa'
import './globals.css'

export const metadata: Metadata = {
  title: PWA_APP_NAME,
  description: PWA_DESCRIPTION,
  applicationName: PWA_APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: PWA_APP_NAME,
  },
}

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: PWA_BACKGROUND_COLOR }}
      >
        {children}
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-40 px-4">
          <div className="pointer-events-auto mx-auto max-w-md">
            <PwaInstallCard />
          </div>
        </div>
      </body>
    </html>
  )
}
