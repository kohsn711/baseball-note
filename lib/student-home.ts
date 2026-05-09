import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { formatYmd } from '@/lib/date-jst'
import type { TeamSummary } from '@/lib/team'

export type RecentReaction = {
  kind: 'reaction'
  id: string
  createdAt: string
  text: string
  senderName: string
  recordDate: string
}

export type RecentComment = {
  kind: 'comment'
  id: string
  createdAt: string
  text: string
  senderName: string
  recordDate: string
}

export type RecentFeedback = RecentReaction | RecentComment

export type GoalSummary = {
  id: string
  title: string
  category: string
  targetDate: string | null
}

export type StudentHomeData = {
  todayRecorded: boolean
  monthlyDates: Set<string>
  recentDates: Set<string>
  feedback: RecentFeedback[]
  teams: TeamSummary[]
  unreadCount: number
}

// 当月 + 前月末 / 翌月頭まで含む範囲の記録日付を取得 (カレンダー描画用)
export const fetchMonthlyRecordedDates = async (
  studentId: string,
  year: number,
  month0: number
): Promise<Set<string>> => {
  const supabase = await createClient()
  const start = formatYmd(year, month0, 1)
  // 当月末 + 翌月数日も含めるため翌月7日まで取得
  const nextMonthDate = new Date(Date.UTC(year, month0 + 1, 7))
  const end = formatYmd(
    nextMonthDate.getUTCFullYear(),
    nextMonthDate.getUTCMonth(),
    nextMonthDate.getUTCDate()
  )
  // 前月末も含めるため前月25日から
  const prevMonthDate = new Date(Date.UTC(year, month0, -6))
  const rangeStart = formatYmd(
    prevMonthDate.getUTCFullYear(),
    prevMonthDate.getUTCMonth(),
    prevMonthDate.getUTCDate()
  )

  const { data } = await supabase
    .from('daily_records')
    .select('record_date')
    .eq('student_id', studentId)
    .gte('record_date', rangeStart < start ? rangeStart : start)
    .lte('record_date', end)

  return new Set((data ?? []).map((r) => r.record_date as string))
}

// 連続記録日数計算用に直近35日分の日付を取得
export const fetchRecentRecordedDates = async (studentId: string): Promise<Set<string>> => {
  const supabase = await createClient()
  const now = new Date()
  const past = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
  const startIso = past.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_records')
    .select('record_date')
    .eq('student_id', studentId)
    .gte('record_date', startIso)

  return new Set((data ?? []).map((r) => r.record_date as string))
}

export const fetchRecentFeedback = async (studentId: string): Promise<RecentFeedback[]> => {
  const supabase = await createClient()

  const [reactionsRes, commentsRes] = await Promise.all([
    supabase
      .from('reactions')
      .select(`
        id,
        emoji,
        created_at,
        daily_records!inner(student_id, record_date),
        sender:profiles(display_name)
      `)
      .eq('daily_records.student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select(`
        id,
        created_at,
        daily_records!inner(student_id, record_date),
        sender:profiles(display_name),
        preset:preset_comments(text)
      `)
      .eq('daily_records.student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  type ReactionRow = {
    id: string
    emoji: string
    created_at: string
    daily_records: { record_date: string } | { record_date: string }[]
    sender: { display_name: string } | { display_name: string }[] | null
  }
  type CommentRow = {
    id: string
    created_at: string
    daily_records: { record_date: string } | { record_date: string }[]
    sender: { display_name: string } | { display_name: string }[] | null
    preset: { text: string } | { text: string }[] | null
  }

  const pickOne = <T,>(v: T | T[] | null | undefined): T | undefined =>
    Array.isArray(v) ? v[0] : v ?? undefined

  const reactions: RecentReaction[] = ((reactionsRes.data ?? []) as ReactionRow[]).map((r) => ({
    kind: 'reaction',
    id: r.id,
    createdAt: r.created_at,
    text: r.emoji,
    senderName: pickOne(r.sender)?.display_name ?? '',
    recordDate: pickOne(r.daily_records)?.record_date ?? '',
  }))

  const comments: RecentComment[] = ((commentsRes.data ?? []) as CommentRow[]).map((c) => ({
    kind: 'comment',
    id: c.id,
    createdAt: c.created_at,
    text: pickOne(c.preset)?.text ?? '',
    senderName: pickOne(c.sender)?.display_name ?? '',
    recordDate: pickOne(c.daily_records)?.record_date ?? '',
  }))

  return [...reactions, ...comments]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)
}

export const fetchStudentHomeData = async (
  studentId: string,
  year: number,
  month0: number,
  todayIso: string
): Promise<StudentHomeData> => {
  const supabase = await createClient()

  const start = formatYmd(year, month0, 1)
  const nextMonthDate = new Date(Date.UTC(year, month0 + 1, 7))
  const end = formatYmd(
    nextMonthDate.getUTCFullYear(),
    nextMonthDate.getUTCMonth(),
    nextMonthDate.getUTCDate()
  )
  const prevMonthDate = new Date(Date.UTC(year, month0, -6))
  const rangeStart = formatYmd(
    prevMonthDate.getUTCFullYear(),
    prevMonthDate.getUTCMonth(),
    prevMonthDate.getUTCDate()
  )
  const calendarStart = rangeStart < start ? rangeStart : start
  const recentStart = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [
    recordedDatesRes,
    reactionsRes,
    commentsRes,
    teamsRes,
    unreadRes,
  ] = await Promise.all([
    supabase
      .from('daily_records')
      .select('record_date')
      .eq('student_id', studentId)
      .gte('record_date', recentStart < calendarStart ? recentStart : calendarStart)
      .lte('record_date', end),
    supabase
      .from('reactions')
      .select(`
        id,
        emoji,
        created_at,
        daily_records!inner(student_id, record_date),
        sender:profiles(display_name)
      `)
      .eq('daily_records.student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        daily_records!inner(student_id, record_date),
        sender:profiles(display_name)
      `)
      .eq('daily_records.student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('team_members')
      .select('team_id, teams ( id, name, team_code )')
      .eq('user_id', studentId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', studentId)
      .eq('is_read', false),
  ])

  type DateRow = { record_date: string }
  const dateRows = (recordedDatesRes.data ?? []) as DateRow[]
  const monthlyDates = new Set(
    dateRows
      .filter((r) => r.record_date >= calendarStart && r.record_date <= end)
      .map((r) => r.record_date)
  )
  const recentDates = new Set(
    dateRows
      .filter((r) => r.record_date >= recentStart)
      .map((r) => r.record_date)
  )

  type ReactionRow = {
    id: string
    emoji: string
    created_at: string
    daily_records: { record_date: string } | { record_date: string }[]
    sender: { display_name: string } | { display_name: string }[] | null
  }
  type CommentRow = {
    id: string
    text: string | null
    created_at: string
    daily_records: { record_date: string } | { record_date: string }[]
    sender: { display_name: string } | { display_name: string }[] | null
  }
  type TeamRow = { id: string; name: string; team_code: string }
  type TeamMemberRow = { teams: TeamRow | TeamRow[] | null }

  const pickOne = <T,>(v: T | T[] | null | undefined): T | undefined =>
    Array.isArray(v) ? v[0] : v ?? undefined

  const reactions: RecentReaction[] = ((reactionsRes.data ?? []) as ReactionRow[]).map((r) => ({
    kind: 'reaction',
    id: r.id,
    createdAt: r.created_at,
    text: r.emoji,
    senderName: pickOne(r.sender)?.display_name ?? '',
    recordDate: pickOne(r.daily_records)?.record_date ?? '',
  }))

  const comments: RecentComment[] = ((commentsRes.data ?? []) as CommentRow[]).map((c) => ({
    kind: 'comment',
    id: c.id,
    createdAt: c.created_at,
    text: c.text ?? '',
    senderName: pickOne(c.sender)?.display_name ?? '',
    recordDate: pickOne(c.daily_records)?.record_date ?? '',
  }))

  const teams = ((teamsRes.data ?? []) as unknown as TeamMemberRow[])
    .map((row) => {
      const team = pickOne(row.teams)
      if (!team) return null
      return { id: team.id, name: team.name, teamCode: team.team_code }
    })
    .filter((t): t is TeamSummary => t !== null)

  return {
    todayRecorded: dateRows.some((r) => r.record_date === todayIso),
    monthlyDates,
    recentDates,
    feedback: [...reactions, ...comments]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5),
    teams,
    unreadCount: unreadRes.count ?? 0,
  }
}

export const fetchActiveGoals = async (studentId: string): Promise<GoalSummary[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('goals')
    .select('id, title, category, target_date')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  return (data ?? []).map((g) => ({
    id: g.id as string,
    title: g.title as string,
    category: g.category as string,
    targetDate: (g.target_date as string | null) ?? null,
  }))
}

export const isTodayRecorded = async (
  studentId: string,
  todayIso: string
): Promise<boolean> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_records')
    .select('id')
    .eq('student_id', studentId)
    .eq('record_date', todayIso)
    .maybeSingle()
  return Boolean(data)
}
