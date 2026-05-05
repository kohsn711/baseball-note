import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type UserRole = 'student' | 'coach' | 'parent' | 'admin'

// ログイン成功後のリダイレクト先を決める
// profilesにレコードがなければ初期設定画面へ。あればロール別ホームへ
export const getPostLoginPath = async (): Promise<string> => {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return '/login'

  // profilesテーブルはチケット04で作成される。未作成 / 行なし いずれの場合も初期設定へ
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile?.role) {
    return '/setup'
  }

  switch (profile.role as UserRole) {
    case 'student':
      return '/student'
    case 'coach':
      return '/coach'
    case 'parent':
      return '/parent'
    case 'admin':
      return '/admin'
    default:
      return '/setup'
  }
}
