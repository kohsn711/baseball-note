import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { Goal, GoalCategory, GoalStatus } from './goals-constants'

export {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABEL,
  GOAL_STATUSES,
  GOAL_STATUS_LABEL,
} from './goals-constants'
export type { Goal, GoalCategory, GoalStatus } from './goals-constants'

type GoalRow = {
  id: string
  student_id: string
  title: string
  description: string | null
  category: string
  target_date: string | null
  status: string
  created_at: string
  updated_at: string
}

const mapRow = (r: GoalRow): Goal => ({
  id: r.id,
  studentId: r.student_id,
  title: r.title,
  description: r.description,
  category: r.category as GoalCategory,
  targetDate: r.target_date,
  status: r.status as GoalStatus,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const fetchGoalsByStatus = async (
  studentId: string,
  status: GoalStatus
): Promise<Goal[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  return ((data ?? []) as GoalRow[]).map(mapRow)
}

export const fetchGoalById = async (
  goalId: string,
  studentId: string
): Promise<Goal | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (!data) return null
  return mapRow(data as GoalRow)
}
