import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { roleHomePath } from '@/lib/role'

// 認証不要のパス（プレフィックス一致）
const PUBLIC_PATHS = ['/login', '/auth']
const PUBLIC_PREFIX_PATHS = ['/icon', '/apple-icon']
const PUBLIC_EXACT_PATHS = ['/manifest.webmanifest']

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() はJWT署名をプロジェクト公開鍵で毎回検証するため安全
  // 同時にトークンのリフレッシュも行う
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const { pathname } = request.nextUrl
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    PUBLIC_PREFIX_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    PUBLIC_EXACT_PATHS.includes(pathname)

  if (claims && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', claims.sub)
      .maybeSingle()

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = roleHomePath(profile?.role)
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (!claims && !isPublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // 認証済みかつ非公開パスの場合、初期設定の有無で振り分ける
  if (claims && !isPublic) {
    const userId = claims.sub
    const isOnSetup = pathname.startsWith('/setup')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.role && !isOnSetup) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/setup'
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }

    if (profile?.role && isOnSetup) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = roleHomePath(profile.role)
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}
