'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { GOAL_CATEGORIES, GOAL_STATUSES, type GoalCategory, type GoalStatus } from '@/lib/goals-constants'

export type GoalFormState = { error?: string; values?: GoalInput } | undefined

export type GoalInput = {
  title: string
  description: string
  category: string
  target_date: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const parseInput = (formData: FormData): GoalInput => ({
  title: String(formData.get('title') ?? '').trim(),
  description: String(formData.get('description') ?? '').trim(),
  category: String(formData.get('category') ?? '').trim(),
  target_date: String(formData.get('target_date') ?? '').trim(),
})

const validate = (
  input: GoalInput
): { error?: string; values: { title: string; description: string | null; category: GoalCategory; target_date: string | null } } => {
  if (!input.title) return { error: 'タイトルを入力してください。', values: { title: '', description: null, category: 'general', target_date: null } }
  if (input.title.length > 100) return { error: 'タイトルは100文字以内で入力してください。', values: { title: '', description: null, category: 'general', target_date: null } }
  if (input.description.length > 1000) return { error: '内容は1000文字以内で入力してください。', values: { title: '', description: null, category: 'general', target_date: null } }
  if (!GOAL_CATEGORIES.includes(input.category as GoalCategory)) {
    return { error: 'カテゴリの指定が不正です。', values: { title: '', description: null, category: 'general', target_date: null } }
  }
  if (input.target_date && !ISO_DATE.test(input.target_date)) {
    return { error: '達成期限の形式が不正です。', values: { title: '', description: null, category: 'general', target_date: null } }
  }
  return {
    values: {
      title: input.title,
      description: input.description || null,
      category: input.category as GoalCategory,
      target_date: input.target_date || null,
    },
  }
}

const requireStudent = async (): Promise<string> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.role) redirect('/setup')
  if (profile.role !== 'student') redirect('/login')
  return userId
}

export const createGoal = async (
  _prev: GoalFormState,
  formData: FormData
): Promise<GoalFormState> => {
  const input = parseInput(formData)
  const v = validate(input)
  if (v.error) return { error: v.error, values: input }

  const userId = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase.from('goals').insert({
    student_id: userId,
    title: v.values.title,
    description: v.values.description,
    category: v.values.category,
    target_date: v.values.target_date,
    status: 'active',
  })

  if (error) {
    return { error: '目標の保存に失敗しました。時間をおいて再度お試しください。', values: input }
  }

  revalidatePath('/goals')
  revalidatePath('/home')
  redirect('/goals')
}

export const updateGoal = async (
  goalId: string,
  _prev: GoalFormState,
  formData: FormData
): Promise<GoalFormState> => {
  const input = parseInput(formData)
  const v = validate(input)
  if (v.error) return { error: v.error, values: input }

  const userId = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('goals')
    .update({
      title: v.values.title,
      description: v.values.description,
      category: v.values.category,
      target_date: v.values.target_date,
    })
    .eq('id', goalId)
    .eq('student_id', userId)

  if (error) {
    return { error: '目標の保存に失敗しました。時間をおいて再度お試しください。', values: input }
  }

  revalidatePath('/goals')
  revalidatePath('/home')
  redirect('/goals')
}

export const changeGoalStatus = async (goalId: string, status: GoalStatus): Promise<void> => {
  if (!GOAL_STATUSES.includes(status)) return
  const userId = await requireStudent()
  const supabase = await createClient()

  await supabase
    .from('goals')
    .update({ status })
    .eq('id', goalId)
    .eq('student_id', userId)

  revalidatePath('/goals')
  revalidatePath('/home')
}
