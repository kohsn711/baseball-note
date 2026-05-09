import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export const proxy = async (request: NextRequest) => {
  return await updateSession(request)
}

export const config = {
  // 静的アセットとPWAメタデータは除外。それ以外のリクエストでセッションを更新する
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
