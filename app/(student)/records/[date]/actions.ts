'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  AFFECTS_LEVELS,
  BODY_PARTS,
  CONDITION_LEVELS,
  MEAL_SLOTS,
  PRACTICE_TYPES,
  TRAINING_TYPES,
  WATER_LEVELS,
  type AffectsLevel,
  type BodyPart,
  type ConditionLevel,
  type MealStatus,
  type PracticeType,
  type TrainingType,
  type WaterLevel,
} from '@/lib/daily-record'

export type RecordActionState = { error?: string; savedAt?: string } | undefined

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const toIntOrNull = (raw: FormDataEntryValue | null): number | null => {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

const toFloatOrNull = (raw: FormDataEntryValue | null): number | null => {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return n
}

const toStringOrNull = (raw: FormDataEntryValue | null): string | null => {
  if (raw == null) return null
  const s = String(raw).trim()
  return s === '' ? null : s
}

const isMealStatus = (v: string | null): v is MealStatus => v === 'ate' || v === 'skipped'

export const saveDailyRecord = async (
  _prev: RecordActionState,
  formData: FormData
): Promise<RecordActionState> => {
  const recordDate = String(formData.get('record_date') ?? '')
  if (!ISO_DATE.test(recordDate)) return { error: '日付が不正です。' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.role !== 'student') return { error: '学生のみ記録を作成できます。' }

  const { data: upsertedParent, error: parentErr } = await supabase
    .from('daily_records')
    .upsert(
      { student_id: userId, record_date: recordDate },
      { onConflict: 'student_id,record_date' }
    )
    .select('id')
    .single()
  if (parentErr || !upsertedParent) {
    return { error: '記録の保存に失敗しました。時間をおいて再度お試しください。' }
  }
  const dailyRecordId = upsertedParent.id as string

  // practice_entries: delete+insert (簡潔さ優先)
  const practiceRows = PRACTICE_TYPES.map((type) => {
    const count = toIntOrNull(formData.get(`practice_${type}_count`))
    const duration = toIntOrNull(formData.get(`practice_${type}_duration`))
    const memo = type === 'free' ? toStringOrNull(formData.get(`practice_${type}_memo`)) : null
    if (count === null && duration === null && memo === null) return null
    return {
      daily_record_id: dailyRecordId,
      type: type as PracticeType,
      count,
      duration_minutes: duration,
      memo,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  const trainingRows = TRAINING_TYPES.map((type) => {
    const count = toIntOrNull(formData.get(`training_${type}_count`))
    const duration = toIntOrNull(formData.get(`training_${type}_duration`))
    const memo = type === 'free' ? toStringOrNull(formData.get(`training_${type}_memo`)) : null
    if (count === null && duration === null && memo === null) return null
    return {
      daily_record_id: dailyRecordId,
      type: type as TrainingType,
      count,
      duration_minutes: duration,
      memo,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  const { error: delPracticeErr } = await supabase
    .from('practice_entries')
    .delete()
    .eq('daily_record_id', dailyRecordId)
  if (delPracticeErr) return { error: '練習記録の保存に失敗しました。' }
  if (practiceRows.length > 0) {
    const { error } = await supabase.from('practice_entries').insert(practiceRows)
    if (error) return { error: '練習記録の保存に失敗しました。' }
  }

  const { error: delTrainingErr } = await supabase
    .from('training_entries')
    .delete()
    .eq('daily_record_id', dailyRecordId)
  if (delTrainingErr) return { error: '体づくり記録の保存に失敗しました。' }
  if (trainingRows.length > 0) {
    const { error } = await supabase.from('training_entries').insert(trainingRows)
    if (error) return { error: '体づくり記録の保存に失敗しました。' }
  }

  // meal_records (1:1 upsert)
  const mealValues: Record<string, MealStatus | null> = {}
  for (const slot of MEAL_SLOTS) {
    const v = toStringOrNull(formData.get(`meal_${slot}`))
    mealValues[slot] = isMealStatus(v) ? v : null
  }
  const waterRaw = toStringOrNull(formData.get('meal_water'))
  const waterLevel: WaterLevel | null = WATER_LEVELS.includes(waterRaw as WaterLevel)
    ? (waterRaw as WaterLevel)
    : null
  const mealMemo = toStringOrNull(formData.get('meal_memo'))
  const hasMeal =
    Object.values(mealValues).some((v) => v !== null) || waterLevel !== null || mealMemo !== null

  if (hasMeal) {
    const { error } = await supabase.from('meal_records').upsert(
      {
        daily_record_id: dailyRecordId,
        breakfast: mealValues.breakfast,
        lunch: mealValues.lunch,
        dinner: mealValues.dinner,
        snack: mealValues.snack,
        water_level: waterLevel,
        memo: mealMemo,
      },
      { onConflict: 'daily_record_id' }
    )
    if (error) return { error: '食事記録の保存に失敗しました。' }
  } else {
    await supabase.from('meal_records').delete().eq('daily_record_id', dailyRecordId)
  }

  // condition_records
  const sleepHours = toFloatOrNull(formData.get('condition_sleep_hours'))
  const wakeTime = toStringOrNull(formData.get('condition_wake_time'))
  const sleepTime = toStringOrNull(formData.get('condition_sleep_time'))
  const weightKg = toFloatOrNull(formData.get('condition_weight_kg'))
  const conditionRaw = toStringOrNull(formData.get('condition_level'))
  const conditionLevel: ConditionLevel | null = CONDITION_LEVELS.includes(
    conditionRaw as ConditionLevel
  )
    ? (conditionRaw as ConditionLevel)
    : null
  const hasCondition =
    sleepHours !== null ||
    wakeTime !== null ||
    sleepTime !== null ||
    weightKg !== null ||
    conditionLevel !== null

  if (hasCondition) {
    const { error } = await supabase.from('condition_records').upsert(
      {
        daily_record_id: dailyRecordId,
        sleep_hours: sleepHours,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        weight_kg: weightKg,
        condition: conditionLevel,
      },
      { onConflict: 'daily_record_id' }
    )
    if (error) return { error: '体調記録の保存に失敗しました。' }
  } else {
    await supabase.from('condition_records').delete().eq('daily_record_id', dailyRecordId)
  }

  // injury_records
  const hasPain = formData.get('injury_has_pain') === 'on'
  const bodyPartRaw = toStringOrNull(formData.get('injury_body_part'))
  const bodyPart: BodyPart | null = BODY_PARTS.includes(bodyPartRaw as BodyPart)
    ? (bodyPartRaw as BodyPart)
    : null
  const painLevel = toIntOrNull(formData.get('injury_pain_level'))
  const affectsRaw = toStringOrNull(formData.get('injury_affects_practice'))
  const affectsLevel: AffectsLevel | null = AFFECTS_LEVELS.includes(affectsRaw as AffectsLevel)
    ? (affectsRaw as AffectsLevel)
    : null
  const injuryMemo = toStringOrNull(formData.get('injury_memo'))

  const hasInjury =
    hasPain ||
    bodyPart !== null ||
    painLevel !== null ||
    affectsLevel !== null ||
    injuryMemo !== null

  if (hasInjury) {
    const validPainLevel = painLevel !== null && painLevel >= 1 && painLevel <= 5 ? painLevel : null
    const { error } = await supabase.from('injury_records').upsert(
      {
        daily_record_id: dailyRecordId,
        has_pain: hasPain,
        body_part: bodyPart,
        pain_level: validPainLevel,
        affects_level: affectsLevel,
        memo: injuryMemo,
      },
      { onConflict: 'daily_record_id' }
    )
    if (error) return { error: 'ケガ記録の保存に失敗しました。' }
  } else {
    await supabase.from('injury_records').delete().eq('daily_record_id', dailyRecordId)
  }

  // reflection_records
  const achievements = toStringOrNull(formData.get('reflection_achievements'))
  const challenges = toStringOrNull(formData.get('reflection_challenges'))
  const tomorrowPlan = toStringOrNull(formData.get('reflection_tomorrow_plan'))
  const moodRaw = toIntOrNull(formData.get('reflection_mood'))
  const mood = moodRaw !== null && moodRaw >= 1 && moodRaw <= 5 ? moodRaw : null
  const hasReflection =
    achievements !== null || challenges !== null || tomorrowPlan !== null || mood !== null

  if (hasReflection) {
    const { error } = await supabase.from('reflection_records').upsert(
      {
        daily_record_id: dailyRecordId,
        achievements,
        challenges,
        tomorrow_plan: tomorrowPlan,
        mood,
      },
      { onConflict: 'daily_record_id' }
    )
    if (error) return { error: '振り返り記録の保存に失敗しました。' }
  } else {
    await supabase.from('reflection_records').delete().eq('daily_record_id', dailyRecordId)
  }

  revalidatePath(`/records/${recordDate}`)
  revalidatePath('/home')
  return { savedAt: new Date().toISOString() }
}
