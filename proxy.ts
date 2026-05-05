import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export const proxy = async (request: NextRequest) => {
  return await updateSession(request)
}

export const config = {
  // 静的アセットは除外。それ以外のすべてのリクエストでセッションを更新する
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
