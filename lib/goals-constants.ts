export const GOAL_CATEGORIES = ['practice', 'training', 'meal', 'condition', 'general'] as const
export type GoalCategory = (typeof GOAL_CATEGORIES)[number]

export const GOAL_STATUSES = ['active', 'achieved', 'abandoned'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_CATEGORY_LABEL: Record<GoalCategory, string> = {
  practice: '自主練習',
  training: 'トレーニング',
  meal: '食事',
  condition: 'コンディション',
  general: 'その他',
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  active: '取り組み中',
  achieved: '達成',
  abandoned: '断念',
}

export type Goal = {
  id: string
  studentId: string
  title: string
  description: string | null
  category: GoalCategory
  targetDate: string | null
  status: GoalStatus
  createdAt: string
  updatedAt: string
}
