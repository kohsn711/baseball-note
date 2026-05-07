'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type ParentSetupState = { error?: string } | undefined

export const completeParentSetup = async (
  _prev: ParentSetupState,
  formData: FormData
): Promise<ParentSetupState> => {
  const displayName = String(formData.get('display_name') ?? '').trim()
  if (!displayName) return { error: 'お名前を入力してください。' }
  if (displayName.length > 50) return { error: 'お名前は50文字以内で入力してください。' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined) ?? null
  if (!userId) redirect('/login')

  // 招待がない場合は parent ロールでの登録は許可しない
  if (userEmail) {
    const { data: invites } = await supabase
      .from('parent_child_links')
      .select('id')
      .eq('status', 'pending')
      .is('parent_id', null)
      .eq('invited_email', userEmail.toLowerCase())
      .limit(1)
    if (!invites || invites.length === 0) {
      return { error: '保護者の招待が見つかりませんでした。' }
    }
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      role: 'parent',
      display_name: displayName,
    },
    { onConflict: 'id' }
  )

  if (error) {
    return { error: 'プロフィールの保存に失敗しました。時間をおいて再度お試しください。' }
  }

  redirect('/parent/links')
}
