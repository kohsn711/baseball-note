'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { generateTeamCode, TEAM_CODE_MAX_ATTEMPTS } from '@/lib/team'

export type CreateTeamState = { error?: string } | undefined

export const createTeam = async (
  _prev: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> => {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'チーム名を入力してください。' }
  if (name.length > 50) return { error: 'チーム名は50文字以内で入力してください。' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.role !== 'coach') {
    return { error: 'チームを作成する権限がありません。' }
  }

  let teamId: string | null = null
  for (let attempt = 0; attempt < TEAM_CODE_MAX_ATTEMPTS; attempt++) {
    const code = generateTeamCode()
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, team_code: code, created_by: userId })
      .select('id')
      .single()

    if (!error && data) {
      teamId = data.id
      break
    }
    // 23505 = unique_violation（team_codeの衝突）。これ以外は即時失敗。
    if (error?.code !== '23505') {
      console.error('[createTeam] teams insert failed', error)
      return { error: 'チームの作成に失敗しました。時間をおいて再度お試しください。' }
    }
  }
  if (!teamId) {
    return { error: 'チームコードの生成に失敗しました。再度お試しください。' }
  }

  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    role_in_team: 'coach',
  })
  if (memberError) {
    console.error('[createTeam] team_members insert failed', memberError)
    return { error: 'チームの登録に失敗しました。時間をおいて再度お試しください。' }
  }

  revalidatePath('/coach')
  redirect('/coach')
}
