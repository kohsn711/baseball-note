export const REACTION_EMOJIS = ['👍', '🔥', '💪', '❤️'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export const isReactionEmoji = (v: string): v is ReactionEmoji =>
  (REACTION_EMOJIS as readonly string[]).includes(v)
