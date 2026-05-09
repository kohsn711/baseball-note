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

  const { data: record } = await supabase
    .from('daily_records')
    .select(`
      id,
      practice_entries ( type, count, duration_minutes, memo ),
      training_entries ( type, count, duration_minutes, memo ),
      meal_records ( breakfast, lunch, dinner, snack, water_level, memo ),
      condition_records ( sleep_hours, wake_time, sleep_time, weight_kg, condition ),
      injury_records ( has_pain, body_part, pain_level, affects_level, memo ),
      reflection_records ( achievements, challenges, tomorrow_plan, mood )
    `)
    .eq('student_id', studentId)
    .eq('record_date', recordDate)
    .maybeSingle()

  if (!record?.id) return emptyData(recordDate)

  const dailyRecordId = record.id as string

  const data = emptyData(recordDate)
  data.dailyRecordId = dailyRecordId

  type DailyRecordRow = {
    practice_entries?: Array<{
      type: PracticeType
      count: number | null
      duration_minutes: number | null
      memo: string | null
    }> | null
    training_entries?: Array<{
      type: TrainingType
      count: number | null
      duration_minutes: number | null
      memo: string | null
    }> | null
    meal_records?: {
      breakfast: MealStatus | null
      lunch: MealStatus | null
      dinner: MealStatus | null
      snack: MealStatus | null
      water_level: WaterLevel | null
      memo: string | null
    } | Array<{
      breakfast: MealStatus | null
      lunch: MealStatus | null
      dinner: MealStatus | null
      snack: MealStatus | null
      water_level: WaterLevel | null
      memo: string | null
    }> | null
    condition_records?: {
      sleep_hours: number | null
      wake_time: string | null
      sleep_time: string | null
      weight_kg: number | null
      condition: ConditionLevel | null
    } | Array<{
      sleep_hours: number | null
      wake_time: string | null
      sleep_time: string | null
      weight_kg: number | null
      condition: ConditionLevel | null
    }> | null
    injury_records?: {
      has_pain: boolean | null
      body_part: BodyPart | null
      pain_level: number | null
      affects_level: AffectsLevel | null
      memo: string | null
    } | Array<{
      has_pain: boolean | null
      body_part: BodyPart | null
      pain_level: number | null
      affects_level: AffectsLevel | null
      memo: string | null
    }> | null
    reflection_records?: {
      achievements: string | null
      challenges: string | null
      tomorrow_plan: string | null
      mood: number | null
    } | Array<{
      achievements: string | null
      challenges: string | null
      tomorrow_plan: string | null
      mood: number | null
    }> | null
  }

  const row = record as DailyRecordRow
  const pickOne = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

  for (const entry of row.practice_entries ?? []) {
    data.practice[entry.type] = {
      count: entry.count,
      durationMinutes: entry.duration_minutes,
      memo: entry.memo,
    }
  }
  for (const entry of row.training_entries ?? []) {
    data.training[entry.type] = {
      count: entry.count,
      durationMinutes: entry.duration_minutes,
      memo: entry.memo,
    }
  }

  const meal = pickOne(row.meal_records)
  if (meal) {
    data.meal = {
      breakfast: meal.breakfast ?? null,
      lunch: meal.lunch ?? null,
      dinner: meal.dinner ?? null,
      snack: meal.snack ?? null,
      waterLevel: meal.water_level ?? null,
      memo: meal.memo ?? null,
    }
  }
  const condition = pickOne(row.condition_records)
  if (condition) {
    data.condition = {
      sleepHours: condition.sleep_hours ?? null,
      wakeTime: condition.wake_time ?? null,
      sleepTime: condition.sleep_time ?? null,
      weightKg: condition.weight_kg ?? null,
      condition: condition.condition ?? null,
    }
  }
  const injury = pickOne(row.injury_records)
  if (injury) {
    data.injury = {
      hasPain: Boolean(injury.has_pain),
      bodyPart: injury.body_part ?? null,
      painLevel: injury.pain_level ?? null,
      affectsLevel: injury.affects_level ?? null,
      memo: injury.memo ?? null,
    }
  }
  const reflection = pickOne(row.reflection_records)
  if (reflection) {
    data.reflection = {
      achievements: reflection.achievements ?? null,
      challenges: reflection.challenges ?? null,
      tomorrowPlan: reflection.tomorrow_plan ?? null,
      mood: reflection.mood ?? null,
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
