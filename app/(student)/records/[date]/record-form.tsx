'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveDailyRecord, type RecordActionState } from './actions'
import { isDirty, setDirty } from './dirty-store'
import type { DailyRecordData } from '@/lib/daily-record'

type CategoryKey = 'practice' | 'training' | 'meal' | 'condition' | 'injury' | 'reflection'

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'practice', label: '練習' },
  { key: 'training', label: '体づくり' },
  { key: 'meal', label: '食事' },
  { key: 'condition', label: '体調' },
  { key: 'injury', label: 'ケガ' },
  { key: 'reflection', label: '振り返り' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-500 focus:outline-none'
const labelClass = 'block text-sm font-medium text-slate-700'

const NumberField = ({
  name,
  label,
  defaultValue,
  unit,
  step,
}: {
  name: string
  label: string
  defaultValue: number | null
  unit: string
  step?: string
}) => (
  <div className="flex items-center gap-2">
    <label htmlFor={name} className="flex-1 text-sm text-slate-700">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type="number"
      inputMode="decimal"
      min={0}
      step={step ?? '1'}
      defaultValue={defaultValue ?? ''}
      className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-base focus:border-slate-500 focus:outline-none"
    />
    <span className="w-8 shrink-0 text-sm text-slate-500">{unit}</span>
  </div>
)

const RadioGroup = ({
  name,
  options,
  value,
}: {
  name: string
  options: { value: string; label: string }[]
  value: string | null
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <label
        key={opt.value}
        className="flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
      >
        <input
          type="radio"
          name={name}
          value={opt.value}
          defaultChecked={value === opt.value}
          className="sr-only"
        />
        {opt.label}
      </label>
    ))}
  </div>
)

export const RecordForm = ({ data }: { data: DailyRecordData }) => {
  const [active, setActive] = useState<CategoryKey>('practice')
  const [showToast, setShowToast] = useState(false)
  const [state, formAction, pending] = useActionState<RecordActionState, FormData>(
    saveDailyRecord,
    undefined
  )

  // 保存成功時: ダーティ解除＋トースト表示（2.5秒で消える）
  useEffect(() => {
    if (!state?.savedAt || state.error) return
    setDirty(false)
    const showId = setTimeout(() => setShowToast(true), 0)
    const hideId = setTimeout(() => setShowToast(false), 2500)
    return () => {
      clearTimeout(showId)
      clearTimeout(hideId)
    }
  }, [state?.savedAt, state?.error])

  // タブやリロード／閉じるでの離脱を防ぐ
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty()) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      className="space-y-4"
    >
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-lg"
        >
          保存しました ✓
        </div>
      )}
      <input type="hidden" name="record_date" value={data.recordDate} />

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                active === c.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* practice */}
      <section className={active === 'practice' ? 'space-y-3' : 'hidden'}>
        <NumberField name="practice_swing_count" label="素振り" unit="回" defaultValue={data.practice.swing?.count ?? null} />
        <NumberField name="practice_tee_batting_count" label="ティー打撃" unit="回" defaultValue={data.practice.tee_batting?.count ?? null} />
        <NumberField name="practice_catch_ball_duration" label="キャッチボール" unit="分" defaultValue={data.practice.catch_ball?.durationMinutes ?? null} />
        <NumberField name="practice_pitching_count" label="投球練習" unit="球" defaultValue={data.practice.pitching?.count ?? null} />
        <NumberField name="practice_fielding_duration" label="守備練習" unit="分" defaultValue={data.practice.fielding?.durationMinutes ?? null} />
        <NumberField name="practice_baserunning_duration" label="走塁練習" unit="分" defaultValue={data.practice.baserunning?.durationMinutes ?? null} />
        <div className="space-y-1">
          <label htmlFor="practice_free_memo" className={labelClass}>自由メモ</label>
          <textarea
            id="practice_free_memo"
            name="practice_free_memo"
            rows={3}
            defaultValue={data.practice.free?.memo ?? ''}
            className={inputClass}
          />
        </div>
      </section>

      {/* training */}
      <section className={active === 'training' ? 'space-y-3' : 'hidden'}>
        <NumberField name="training_running_duration" label="ランニング" unit="分" defaultValue={data.training.running?.durationMinutes ?? null} />
        <NumberField name="training_dash_count" label="ダッシュ" unit="本" defaultValue={data.training.dash?.count ?? null} />
        <NumberField name="training_pushup_count" label="腕立て" unit="回" defaultValue={data.training.pushup?.count ?? null} />
        <NumberField name="training_situp_count" label="腹筋" unit="回" defaultValue={data.training.situp?.count ?? null} />
        <NumberField name="training_squat_count" label="スクワット" unit="回" defaultValue={data.training.squat?.count ?? null} />
        <NumberField name="training_stretch_duration" label="ストレッチ" unit="分" defaultValue={data.training.stretch?.durationMinutes ?? null} />
        <div className="space-y-1">
          <label htmlFor="training_free_memo" className={labelClass}>自由メモ</label>
          <textarea
            id="training_free_memo"
            name="training_free_memo"
            rows={3}
            defaultValue={data.training.free?.memo ?? ''}
            className={inputClass}
          />
        </div>
      </section>

      {/* meal */}
      <section className={active === 'meal' ? 'space-y-4' : 'hidden'}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => {
          const labels = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '補食' }
          return (
            <div key={slot} className="space-y-1">
              <p className={labelClass}>{labels[slot]}</p>
              <RadioGroup
                name={`meal_${slot}`}
                value={data.meal[slot]}
                options={[
                  { value: 'ate', label: '食べた' },
                  { value: 'skipped', label: '抜いた' },
                ]}
              />
            </div>
          )
        })}
        <div className="space-y-1">
          <p className={labelClass}>水分</p>
          <RadioGroup
            name="meal_water"
            value={data.meal.waterLevel}
            options={[
              { value: 'low', label: '少ない' },
              { value: 'normal', label: 'ふつう' },
              { value: 'high', label: '多い' },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="meal_memo" className={labelClass}>食事メモ</label>
          <textarea
            id="meal_memo"
            name="meal_memo"
            rows={3}
            defaultValue={data.meal.memo ?? ''}
            className={inputClass}
          />
        </div>
      </section>

      {/* condition */}
      <section className={active === 'condition' ? 'space-y-3' : 'hidden'}>
        <NumberField
          name="condition_sleep_hours"
          label="睡眠時間"
          unit="時間"
          step="0.5"
          defaultValue={data.condition.sleepHours}
        />
        <div className="flex items-center gap-2">
          <label htmlFor="condition_wake_time" className="flex-1 text-sm text-slate-700">起床時刻</label>
          <input
            id="condition_wake_time"
            name="condition_wake_time"
            type="time"
            defaultValue={data.condition.wakeTime ?? ''}
            className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-base focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="condition_sleep_time" className="flex-1 text-sm text-slate-700">就寝時刻</label>
          <input
            id="condition_sleep_time"
            name="condition_sleep_time"
            type="time"
            defaultValue={data.condition.sleepTime ?? ''}
            className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-base focus:border-slate-500 focus:outline-none"
          />
        </div>
        <NumberField
          name="condition_weight_kg"
          label="体重"
          unit="kg"
          step="0.1"
          defaultValue={data.condition.weightKg}
        />
        <div className="space-y-1">
          <p className={labelClass}>体調</p>
          <RadioGroup
            name="condition_level"
            value={data.condition.condition}
            options={[
              { value: 'good', label: '良い' },
              { value: 'normal', label: 'ふつう' },
              { value: 'bad', label: '悪い' },
            ]}
          />
        </div>
      </section>

      {/* injury */}
      <section className={active === 'injury' ? 'space-y-3' : 'hidden'}>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
          <input
            type="checkbox"
            name="injury_has_pain"
            defaultChecked={data.injury.hasPain}
            className="h-4 w-4"
          />
          <span className="text-sm text-slate-700">痛みがある</span>
        </label>
        <div className="space-y-1">
          <label htmlFor="injury_body_part" className={labelClass}>部位</label>
          <select
            id="injury_body_part"
            name="injury_body_part"
            defaultValue={data.injury.bodyPart ?? ''}
            className={inputClass}
          >
            <option value="">選択しない</option>
            <option value="shoulder">肩</option>
            <option value="elbow">肘</option>
            <option value="wrist">手首</option>
            <option value="back">腰・背中</option>
            <option value="hip">股関節</option>
            <option value="knee">膝</option>
            <option value="ankle">足首</option>
            <option value="thigh">太もも</option>
            <option value="calf">ふくらはぎ</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>痛みレベル</p>
          <RadioGroup
            name="injury_pain_level"
            value={data.injury.painLevel == null ? null : String(data.injury.painLevel)}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
        <div className="space-y-1">
          <p className={labelClass}>練習への影響</p>
          <RadioGroup
            name="injury_affects_practice"
            value={data.injury.affectsLevel}
            options={[
              { value: 'none', label: 'なし' },
              { value: 'little', label: '少しあり' },
              { value: 'serious', label: '大きい' },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="injury_memo" className={labelClass}>メモ</label>
          <textarea
            id="injury_memo"
            name="injury_memo"
            rows={3}
            defaultValue={data.injury.memo ?? ''}
            className={inputClass}
          />
        </div>
      </section>

      {/* reflection */}
      <section className={active === 'reflection' ? 'space-y-3' : 'hidden'}>
        <div className="space-y-1">
          <label htmlFor="reflection_achievements" className={labelClass}>今日できたこと</label>
          <textarea
            id="reflection_achievements"
            name="reflection_achievements"
            rows={3}
            defaultValue={data.reflection.achievements ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="reflection_challenges" className={labelClass}>課題・反省</label>
          <textarea
            id="reflection_challenges"
            name="reflection_challenges"
            rows={3}
            defaultValue={data.reflection.challenges ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="reflection_tomorrow_plan" className={labelClass}>明日やること</label>
          <textarea
            id="reflection_tomorrow_plan"
            name="reflection_tomorrow_plan"
            rows={3}
            defaultValue={data.reflection.tomorrowPlan ?? ''}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <p className={labelClass}>今日の気分</p>
          <RadioGroup
            name="reflection_mood"
            value={data.reflection.mood == null ? null : String(data.reflection.mood)}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
      </section>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="sticky sticky-above-nav -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? '保存中…' : '保存する'}
        </button>
      </div>
    </form>
  )
}