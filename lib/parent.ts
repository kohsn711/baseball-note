import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { calculateStreak } from '@/lib/date-jst'

export type ParentChild = {
  id: string
  displayName: string
  lastRecordDate: string | null
  streak: number
}

export const fetchParentChildren = async (
  parentId: string
): Promise<ParentChild[]> => {
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('parent_child_links')
    .select('student_id')
    .eq('parent_id', parentId)
    .eq('status', 'active')

  const studentIds = Array.from(
    new Set((links ?? []).map((l) => l.student_id as string))
  )
  if (studentIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', studentIds)

  const nameMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    nameMap.set(p.id as string, (p.display_name as string | null) ?? '')
  }

  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [recentRes, lastRes] = await Promise.all([
    supabase
      .from('daily_records')
      .select('student_id, record_date')
      .in('student_id', studentIds)
      .gte('record_date', since),
    supabase
      .from('daily_records')
      .select('student_id, record_date')
      .in('student_id', studentIds)
      .order('record_date', { ascending: false }),
  ])

  const recentByStudent = new Map<string, Set<string>>()
  for (const r of recentRes.data ?? []) {
    const sid = r.student_id as string
    const set = recentByStudent.get(sid) ?? new Set<string>()
    set.add(r.record_date as string)
    recentByStudent.set(sid, set)
  }

  const lastByStudent = new Map<string, string>()
  for (const r of lastRes.data ?? []) {
    const sid = r.student_id as string
    if (!lastByStudent.has(sid)) {
      lastByStudent.set(sid, r.record_date as string)
    }
  }

  const children: ParentChild[] = studentIds.map((sid) => ({
    id: sid,
    displayName: nameMap.get(sid) ?? '',
    lastRecordDate: lastByStudent.get(sid) ?? null,
    streak: calculateStreak(recentByStudent.get(sid) ?? new Set<string>()),
  }))
  children.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
  return children
}

export const fetchParentChild = async (
  parentId: string,
  studentId: string
): Promise<ParentChild | null> => {
  const supabase = await createClient()
  const { data: link } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle()
  if (!link) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', studentId)
    .maybeSingle()

  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [recentRes, lastRes] = await Promise.all([
    supabase
      .from('daily_records')
      .select('record_date')
      .eq('student_id', studentId)
      .gte('record_date', since),
    supabase
      .from('daily_records')
      .select('record_date')
      .eq('student_id', studentId)
      .order('record_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const recordedSet = new Set(
    (recentRes.data ?? []).map((r) => r.record_date as string)
  )

  return {
    id: studentId,
    displayName: (profile?.display_name as string | null) ?? '',
    lastRecordDate: (lastRes.data?.record_date as string | null) ?? null,
    streak: calculateStreak(recordedSet),
  }
}
