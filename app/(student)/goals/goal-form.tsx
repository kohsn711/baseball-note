'use client'

import { useActionState } from 'react'
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABEL,
  type GoalCategory,
} from '@/lib/goals-constants'
import type { GoalFormState } from './actions'

type Defaults = {
  title: string
  description: string
  category: GoalCategory
  target_date: string
}

type Props = {
  action: (state: GoalFormState, formData: FormData) => Promise<GoalFormState>
  defaults: Defaults
  submitLabel: string
}

export const GoalForm = ({ action, defaults, submitLabel }: Props) => {
  const [state, formAction, pending] = useActionState<GoalFormState, FormData>(
    action,
    undefined
  )

  const v = state?.values
  const title = v?.title ?? defaults.title
  const description = v?.description ?? defaults.description
  const category = (v?.category as GoalCategory) || defaults.category
  const targetDate = v?.target_date ?? defaults.target_date

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          タイトル <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={title}
          placeholder="例: 毎日素振り100回"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          内容
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={description}
          placeholder="目標の内容や具体的な行動を記入"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          カテゴリ <span className="text-red-600">*</span>
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        >
          {GOAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {GOAL_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="target_date" className="block text-sm font-medium text-slate-700">
          達成期限
        </label>
        <input
          id="target_date"
          name="target_date"
          type="date"
          defaultValue={targetDate}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '保存中…' : submitLabel}
      </button>
    </form>
  )
}
