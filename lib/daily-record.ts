import 'server-only'
import { createClient } from '@/utils/supabase/server'

export const PRACTICE_TYPES = [
  'swing',
  'tee_batting',
  'catch_ball',
  'pitching',
  'fielding',
  'baserunning',
  'free',
] as const
export type PracticeType = (typeof PRACTICE_TYPES)[number]

export const TRAINING_TYPES = [
  'running',
  'dash',
  'pushup',
  'situp',
  'squat',
  'stretch',
  'free',
] as const
export type TrainingType = (typeof TRAINING_TYPES)[number]

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]
export type MealStatus = 'ate' | 'skipped'

export const WATER_LEVELS = ['low', 'normal', 'high'] as const
export type WaterLevel = (typeof WATER_LEVELS)[number]

export const AFFECTS_LEVELS = ['none', 'little', 'serious'] as const
export type AffectsLevel = (typeof AFFECTS_LEVELS)[number]

export const BODY_PARTS = [
  'shoulder',
  'elbow',
  'wrist',
  'back',
  'hip',
  'knee',
  'ankle',
  'thigh',
  'calf',
  'other',
] as const
export type BodyPart = (typeof BODY_PARTS)[number]

export const CONDITION_LEVELS = ['good', 'normal', 'bad'] as const
export type ConditionLevel = (typeof CONDITION_LEVELS)[number]

export type PracticeEntryInput = {
  type: PracticeType
  count: number | null
  durationMinutes: number | null
  memo: string | null
}
export type TrainingEntryInput = {
  type: TrainingType
  count: number | null
  durationMinutes: number | null
  memo: string | null
}

export type DailyRecordData = {
  recordDate: string
  dailyRecordId: string | null
  practice: Partial<Record<PracticeType, { count: number | null; durationMinutes: number | null; memo: string | null }>>
  training: Partial<Record<TrainingType, { count: number | null; durationMinutes: number | null; memo: string | null }>>
  meal: {
    breakfast: MealStatus | null
    lunch: MealStatus | null
    dinner: MealStatus | null
    snack: MealStatus | null
    waterLevel: WaterLevel | null
    memo: string | null
  }
  condition: {
    sleepHours: number | null
    wakeTime: string | null
    sleepTime: string | null
    weightKg: number | null
    condition: ConditionLevel | null
  }
  injury: {
    hasPain: boolean
    bodyPart: BodyPart | null
    painLevel: number | null
    affectsLevel: AffectsLevel | null
    memo: string | null
  }
  reflection: {
    achievements: string | null
    challenges: string | null
    tomorrowPlan: string | null
    mood: number | null
  }
}

const emptyData = (recordDate: string): DailyRecordData => ({
  recordDate,
  dailyRecordId: null,
  practice: {},
  training: {},
  meal: { breakfast: null, lunch: null, dinner: null, snack: null, waterLevel: null, memo: null },
  condition: { sleepHours: null, wakeTime: null, sleepTime: null, weightKg: null, condition: null },
  injury: { hasPain: false, bodyPart: null, painLevel: null, affectsLevel: null, memo: null },
  reflection: { achievements: null, challenges: null, tomorrowPlan: null, mood: null },
})

export const fetchDailyRecord = async (
  studentId: string,
  recordDate: string
): Promise<DailyRecordData> => {
  const supabase = await createClient()

  const { data: parent } = await supabase
    .from('daily_records')
    .select('id')
    .eq('student_id', studentId)
    .eq('record_date', recordDate)
    .maybeSingle()

  if (!parent?.id) return emptyData(recordDate)

  const dailyRecordId = parent.id as string

  const [practiceRes, trainingRes, mealRes, conditionRes, injuryRes, reflectionRes] =
    await Promise.all([
      supabase
        .from('practice_entries')
        .select('type, count, duration_minutes, memo')
        .eq('daily_record_id', dailyRecordId),
      supabase
        .from('training_entries')
        .select('type, count, duration_minutes, memo')
        .eq('daily_record_id', dailyRecordId),
      supabase
        .from('meal_records')
        .select('breakfast, lunch, dinner, snack, water_level, memo')
        .eq('daily_record_id', dailyRecordId)
        .maybeSingle(),
      supabase
        .from('condition_records')
        .select('sleep_hours, wake_time, sleep_time, weight_kg, condition')
        .eq('daily_record_id', dailyRecordId)
        .maybeSingle(),
      supabase
        .from('injury_records')
        .select('has_pain, body_part, pain_level, affects_level, memo')
        .eq('daily_record_id', dailyRecordId)
        .maybeSingle(),
      supabase
        .from('reflection_records')
        .select('achievements, challenges, tomorrow_plan, mood')
        .eq('daily_record_id', dailyRecordId)
        .maybeSingle(),
    ])

  const data = emptyData(recordDate)
  data.dailyRecordId = dailyRecordId

  for (const row of (practiceRes.data ?? []) as Array<{
    type: PracticeType
    count: number | null
    duration_minutes: number | null
    memo: string | null
  }>) {
    data.practice[row.type] = {
      count: row.count,
      durationMinutes: row.duration_minutes,
      memo: row.memo,
    }
  }
  for (const row of (trainingRes.data ?? []) as Array<{
    type: TrainingType
    count: number | null
    duration_minutes: number | null
    memo: string | null
  }>) {
    data.training[row.type] = {
      count: row.count,
      durationMinutes: row.duration_minutes,
      memo: row.memo,
    }
  }

  if (mealRes.data) {
    data.meal = {
      breakfast: (mealRes.data.breakfast as MealStatus | null) ?? null,
      lunch: (mealRes.data.lunch as MealStatus | null) ?? null,
      dinner: (mealRes.data.dinner as MealStatus | null) ?? null,
      snack: (mealRes.data.snack as MealStatus | null) ?? null,
      waterLevel: (mealRes.data.water_level as WaterLevel | null) ?? null,
      memo: (mealRes.data.memo as string | null) ?? null,
    }
  }
  if (conditionRes.data) {
    data.condition = {
      sleepHours: (conditionRes.data.sleep_hours as number | null) ?? null,
      wakeTime: (conditionRes.data.wake_time as string | null) ?? null,
      sleepTime: (conditionRes.data.sleep_time as string | null) ?? null,
      weightKg: (conditionRes.data.weight_kg as number | null) ?? null,
      condition: (conditionRes.data.condition as ConditionLevel | null) ?? null,
    }
  }
  if (injuryRes.data) {
    data.injury = {
      hasPain: Boolean(injuryRes.data.has_pain),
      bodyPart: (injuryRes.data.body_part as BodyPart | null) ?? null,
      painLevel: (injuryRes.data.pain_level as number | null) ?? null,
      affectsLevel: (injuryRes.data.affects_level as AffectsLevel | null) ?? null,
      memo: (injuryRes.data.memo as string | null) ?? null,
    }
  }
  if (reflectionRes.data) {
    data.reflection = {
      achievements: (reflectionRes.data.achievements as string | null) ?? null,
      challenges: (reflectionRes.data.challenges as string | null) ?? null,
      tomorrowPlan: (reflectionRes.data.tomorrow_plan as string | null) ?? null,
      mood: (reflectionRes.data.mood as number | null) ?? null,
    }
  }

  return data
}

export type RecordReaction = {
  id: string
  emoji: string
  senderId: string
  senderName: string
  createdAt: string
}
export type RecordComment = {
  id: string
  text: string
  senderName: string
  createdAt: string
}

export type SocialViewerRole = 'student' | 'coach' | 'parent'

// viewerRole 視点で「相手側ロール」のものは除外する
//   coach   → parent の送信を除外
//   parent → coach の送信を除外
//   student → 全件
const hiddenSenderRole = (
  viewerRole: SocialViewerRole
): 'coach' | 'parent' | null => {
  if (viewerRole === 'coach') return 'parent'
  if (viewerRole === 'parent') return 'coach'
  return null
}

export const fetchRecordSocial = async (
  dailyRecordId: string,
  viewerRole: SocialViewerRole
): Promise<{ reactions: RecordReaction[]; comments: RecordComment[] }> => {
  const supabase = await createClient()

  const [reactionsRes, commentsRes] = await Promise.all([
    supabase
      .from('reactions')
      .select(
        'id, emoji, sender_id, created_at, sender:profiles!reactions_sender_id_fkey(display_name, role)'
      )
      .eq('daily_record_id', dailyRecordId)
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select(
        'id, text, created_at, sender:profiles!comments_sender_id_fkey(display_name, role)'
      )
      .eq('daily_record_id', dailyRecordId)
      .order('created_at', { ascending: false }),
  ])

  type SenderProfile = { display_name: string; role: string }
  type ReactionRow = {
    id: string
    emoji: string
    sender_id: string
    created_at: string
    sender: SenderProfile | SenderProfile[] | null
  }
  type CommentRow = {
    id: string
    text: string
    created_at: string
    sender: SenderProfile | SenderProfile[] | null
  }

  const pickOne = <T>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

  const hide = hiddenSenderRole(viewerRole)
  const visible = (sender: SenderProfile | null): boolean =>
    hide == null ? true : sender?.role !== hide

  const reactions: RecordReaction[] = ((reactionsRes.data ?? []) as ReactionRow[])
    .map((r) => ({ row: r, sender: pickOne(r.sender) }))
    .filter(({ sender }) => visible(sender))
    .map(({ row, sender }) => ({
      id: row.id,
      emoji: row.emoji,
      senderId: row.sender_id,
      senderName: sender?.display_name ?? '',
      createdAt: row.created_at,
    }))
  const comments: RecordComment[] = ((commentsRes.data ?? []) as CommentRow[])
    .map((c) => ({ row: c, sender: pickOne(c.sender) }))
    .filter(({ sender }) => visible(sender))
    .map(({ row, sender }) => ({
      id: row.id,
      text: row.text,
      senderName: sender?.display_name ?? '',
      createdAt: row.created_at,
    }))

  return { reactions, comments }
}
