'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type SetupActionState = { error?: string } | undefined

const GRADES = ['中1', '中2', '中3', '高1', '高2', '高3'] as const
const POSITIONS = ['投手', '捕手', '内野手', '外野手', 'その他'] as const

const ROLES = ['student', 'coach'] as const
type SetupRole = (typeof ROLES)[number]

export const completeSetup = async (
  _prev: SetupActionState,
  formData: FormData
): Promise<SetupActionState> => {
  const role = String(formData.get('role') ?? 'student').trim() as SetupRole
  const displayName = String(formData.get('display_name') ?? '').trim()
  const grade = String(formData.get('grade') ?? '').trim()
  const position = String(formData.get('position') ?? '').trim()

  if (!ROLES.includes(role)) return { error: 'アカウント種別の指定が不正です。' }
  if (!displayName) return { error: '氏名を入力してください。' }
  if (displayName.length > 50) return { error: '氏名は50文字以内で入力してください。' }
  if (role === 'student') {
    if (grade && !GRADES.includes(grade as (typeof GRADES)[number])) {
      return { error: '学年の指定が不正です。' }
    }
    if (position && !POSITIONS.includes(position as (typeof POSITIONS)[number])) {
      return { error: 'ポジションの指定が不正です。' }
    }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const profileData =
    role === 'coach'
      ? { id: userId, role: 'coach' as const, display_name: displayName }
      : {
          id: userId,
          role: 'student' as const,
          display_name: displayName,
          grade: grade || null,
          position: position || null,
        }

  const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' })

  if (error) {
    return { error: 'プロフィールの保存に失敗しました。時間をおいて再度お試しください。' }
  }

  redirect(role === 'coach' ? '/coach' : '/home')
}
