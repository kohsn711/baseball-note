import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type NotificationItem = {
  id: string
  type: 'reaction' | 'comment' | string
  title: string
  body: string | null
  isRead: boolean
  createdAt: string
  recordId: string | null
  recordDate: string | null
}

export const fetchNotifications = async (
  userId: string,
  limit = 50
): Promise<NotificationItem[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, is_read, created_at, related_record_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as Array<{
    id: string
    type: string
    title: string
    body: string | null
    is_read: boolean
    created_at: string
    related_record_id: string | null
  }>

  const recordIds = Array.from(
    new Set(rows.map((r) => r.related_record_id).filter((v): v is string => Boolean(v)))
  )

  let dateMap = new Map<string, string>()
  if (recordIds.length > 0) {
    const { data: recs } = await supabase
      .from('daily_records')
      .select('id, record_date')
      .in('id', recordIds)
    dateMap = new Map(
      ((recs ?? []) as Array<{ id: string; record_date: string }>).map((r) => [r.id, r.record_date])
    )
  }

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    isRead: r.is_read,
    createdAt: r.created_at,
    recordId: r.related_record_id,
    recordDate: r.related_record_id ? dateMap.get(r.related_record_id) ?? null : null,
  }))
}

export const countUnreadNotifications = async (userId: string): Promise<number> => {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count ?? 0
}

type NotifyInput = {
  userId: string
  type: 'reaction' | 'comment'
  title: string
  body?: string | null
  relatedRecordId: string
}

export const createNotification = async (input: NotifyInput): Promise<void> => {
  const supabase = await createClient()
  await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    related_record_id: input.relatedRecordId,
  })
}
