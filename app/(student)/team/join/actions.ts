'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { TEAM_CODE_PATTERN } from '@/lib/team'

export type JoinTeamState = { error?: string } | undefined

export const joinTeam = async (
  _prev: JoinTeamState,
  formData: FormData
): Promise<JoinTeamState> => {
  const code = String(formData.get('team_code') ?? '')
    .trim()
    .toUpperCase()

  if (!code) return { error: 'チームコードを入力してください。' }
  if (!TEAM_CODE_PATTERN.test(code)) {
    return { error: 'チームコードの形式が正しくありません。' }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.role !== 'student') {
    return { error: 'チームに参加する権限がありません。' }
  }

  const { error: rpcError } = await supabase.rpc('join_team_by_code', {
    _team_code: code,
  })

  if (rpcError) {
    if (rpcError.code === '23505') {
      return { error: 'すでにこのチームに所属しています。' }
    }
    if (rpcError.message.includes('team_not_found')) {
      return { error: 'そのチームコードのチームは見つかりませんでした。' }
    }
    return { error: 'チームの検索に失敗しました。時間をおいて再度お試しください。' }
  }

  revalidatePath('/home')
  redirect('/home')
}
