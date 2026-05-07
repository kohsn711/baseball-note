'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleReaction, sendComment } from '@/app/_actions/social'
import { REACTION_EMOJIS } from '@/lib/social-constants'
import type { RecordReaction, RecordComment } from '@/lib/daily-record'

type PresetComment = { id: string; text: string }

const COMMENT_MAX_LENGTH = 200

type ReactionGroup = { emoji: string; count: number; names: string[] }

const groupReactions = (reactions: RecordReaction[]): ReactionGroup[] => {
  const map = new Map<string, string[]>()
  for (const r of reactions) {
    const prev = map.get(r.emoji) ?? []
    map.set(r.emoji, [...prev, r.senderName])
  }
  return REACTION_EMOJIS.flatMap((emoji) => {
    const names = map.get(emoji)
    return names ? [{ emoji, count: names.length, names }] : []
  })
}

type Props = {
  dailyRecordId: string
  viewerId: string
  canInteract: boolean
  reactions: RecordReaction[]
  comments: RecordComment[]
  presetComments: PresetComment[]
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm">
    <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
    <div className="space-y-3 text-sm text-slate-700">{children}</div>
  </section>
)

const appendPreset = (current: string, preset: string): string => {
  const base = current ?? ''
  if (base.length === 0) return preset
  const sep = /\s$/.test(base) ? '' : '\n'
  return `${base}${sep}${preset}`
}

export const RecordSocial = ({
  dailyRecordId,
  viewerId,
  canInteract,
  reactions,
  comments,
  presetComments,
}: Props) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [expandedEmoji, setExpandedEmoji] = useState<string | null>(null)

  const myReactionEmojis = new Set(
    reactions.filter((r) => r.senderId === viewerId).map((r) => r.emoji)
  )
  const groups = groupReactions(reactions)

  const onToggleReaction = (emoji: string) => {
    setError(null)
    startTransition(async () => {
      const res = await toggleReaction(dailyRecordId, emoji)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const onAppendPreset = (text: string) => {
    setError(null)
    setDraft((prev) => {
      const next = appendPreset(prev, text)
      return next.slice(0, COMMENT_MAX_LENGTH)
    })
  }

  const onSubmit = () => {
    setError(null)
    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      setError('コメントを入力してください。')
      return
    }
    startTransition(async () => {
      const res = await sendComment(dailyRecordId, trimmed)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDraft('')
      router.refresh()
    })
  }

  const remaining = COMMENT_MAX_LENGTH - draft.length

  return (
    <div className="space-y-4">
      <Section title="リアクション">
        {canInteract ? (
          /* coach / parent: トグルボタンのみ（件数・名前リストは不要） */
          <div className="flex flex-wrap gap-2">
            {REACTION_EMOJIS.map((emoji) => {
              const active = myReactionEmojis.has(emoji)
              const group = groups.find((g) => g.emoji === emoji)
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={pending}
                  onClick={() => onToggleReaction(emoji)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-lg transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  } disabled:opacity-50`}
                  aria-pressed={active}
                  aria-label={active ? `${emoji} を取り消す` : `${emoji} を送る`}
                >
                  {emoji}
                  {group && (
                    <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-500'}`}>
                      {group.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          /* student: 件数バッジ、タップで名前一覧を開閉 */
          groups.length === 0 ? (
            <p className="text-slate-500">まだリアクションはありません。</p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.emoji}
                    type="button"
                    title={g.names.join('、')}
                    onClick={() =>
                      setExpandedEmoji((prev) => (prev === g.emoji ? null : g.emoji))
                    }
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 transition hover:bg-slate-100"
                  >
                    <span className="text-lg">{g.emoji}</span>
                    <span className="text-xs font-semibold text-slate-600">{g.count}</span>
                  </button>
                ))}
              </div>
              {expandedEmoji && (() => {
                const g = groups.find((x) => x.emoji === expandedEmoji)
                if (!g) return null
                return (
                  <p className="text-xs text-slate-500">
                    {g.emoji} {g.names.join('、')}
                  </p>
                )
              })()}
            </div>
          )
        )}
      </Section>

      <Section title="コメント">
        {canInteract && (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
              maxLength={COMMENT_MAX_LENGTH}
              rows={3}
              placeholder="自由記述、または下のボタンから定型文を追加できます。"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              disabled={pending}
            />
            <div className="flex flex-wrap gap-2">
              {presetComments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={pending}
                  onClick={() => onAppendPreset(p.text)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {p.text}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">残り {remaining} 文字</span>
              <button
                type="button"
                disabled={pending || draft.trim().length === 0}
                onClick={onSubmit}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-slate-500">まだコメントはありません。</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((cm) => (
              <li key={cm.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{cm.senderName}</p>
                <p className="whitespace-pre-wrap break-words text-slate-900">{cm.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}
    </div>
  )
}
