'use server'

import { createClient } from '@/utils/supabase/server'
import { isReactionEmoji } from '@/lib/social-constants'
import { createNotification } from '@/lib/notifications'

const UUID = /^[0-9a-fA-F-]{36}$/

type ActionResult = { ok: true } | { ok: false; error: string }

const requireCoachOrParent = async (): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { ok: false, error: 'ログインが必要です。' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.role) return { ok: false, error: 'プロフィール未設定です。' }
  if (profile.role !== 'coach' && profile.role !== 'parent') {
    return { ok: false, error: 'この操作は保護者・監督のみ可能です。' }
  }
  return { ok: true, userId }
}

const canSendTo = async (
  userId: string,
  dailyRecordId: string
): Promise<{ ok: boolean; studentId: string | null }> => {
  const supabase = await createClient()
  const { data: dr } = await supabase
    .from('daily_records')
    .select('student_id')
    .eq('id', dailyRecordId)
    .maybeSingle()
  if (!dr?.student_id) return { ok: false, studentId: null }

  const { data: coachOk } = await supabase.rpc('is_coach_of_student', {
    _student_id: dr.student_id,
  })
  if (coachOk === true) return { ok: true, studentId: dr.student_id }

  const { data: parentOk } = await supabase.rpc('is_active_parent_of', {
    _student_id: dr.student_id,
  })
  return { ok: parentOk === true, studentId: dr.student_id }
}

const fetchSenderName = async (userId: string): Promise<string> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()
  return (data?.display_name as string) ?? ''
}

export const toggleReaction = async (
  dailyRecordId: string,
  emoji: string
): Promise<ActionResult> => {
  if (!UUID.test(dailyRecordId)) return { ok: false, error: '記録IDが不正です。' }
  if (!isReactionEmoji(emoji)) return { ok: false, error: '不正なスタンプです。' }

  const auth = await requireCoachOrParent()
  if (!auth.ok) return auth

  const access = await canSendTo(auth.userId, dailyRecordId)
  if (!access.ok || !access.studentId) {
    return { ok: false, error: 'この記録にはリアクションできません。' }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('daily_record_id', dailyRecordId)
    .eq('sender_id', auth.userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id)
    if (error) return { ok: false, error: 'リアクションの取り消しに失敗しました。' }
    return { ok: true }
  }

  const { error } = await supabase.from('reactions').insert({
    daily_record_id: dailyRecordId,
    sender_id: auth.userId,
    emoji,
  })
  if (error) return { ok: false, error: 'リアクションの送信に失敗しました。' }

  if (access.studentId !== auth.userId) {
    const senderName = await fetchSenderName(auth.userId)
    await createNotification({
      userId: access.studentId,
      type: 'reaction',
      title: `${senderName || '応援者'}さんからリアクションが届きました`,
      body: emoji,
      relatedRecordId: dailyRecordId,
    })
  }

  return { ok: true }
}

const COMMENT_MAX_LENGTH = 200

export const sendComment = async (
  dailyRecordId: string,
  text: string
): Promise<ActionResult> => {
  if (!UUID.test(dailyRecordId)) return { ok: false, error: '記録IDが不正です。' }

  const trimmed = (text ?? '').trim()
  if (trimmed.length === 0) {
    return { ok: false, error: 'コメントを入力してください。' }
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return { ok: false, error: `コメントは${COMMENT_MAX_LENGTH}文字以内で入力してください。` }
  }

  const auth = await requireCoachOrParent()
  if (!auth.ok) return auth

  const access = await canSendTo(auth.userId, dailyRecordId)
  if (!access.ok || !access.studentId) {
    return { ok: false, error: 'この記録にはコメントできません。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('comments').insert({
    daily_record_id: dailyRecordId,
    sender_id: auth.userId,
    text: trimmed,
  })
  if (error) return { ok: false, error: 'コメントの送信に失敗しました。' }

  if (access.studentId !== auth.userId) {
    const senderName = await fetchSenderName(auth.userId)
    await createNotification({
      userId: access.studentId,
      type: 'comment',
      title: `${senderName || '応援者'}さんからコメントが届きました`,
      body: trimmed,
      relatedRecordId: dailyRecordId,
    })
  }

  return { ok: true }
}
