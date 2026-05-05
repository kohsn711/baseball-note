import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { roleHomePath } from '@/lib/role'

export type { UserRole } from '@/lib/role'

// ログイン成功後のリダイレクト先を決める
// profilesにレコードがなければ初期設定画面へ。あればロール別ホームへ
export const getPostLoginPath = async (): Promise<string> => {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return '/login'

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile?.role) return '/setup'
  return roleHomePath(profile.role)
}
