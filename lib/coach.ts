import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { calculateStreak } from '@/lib/date-jst'
import { fetchTeamsForUser, type TeamSummary } from '@/lib/team'

export type CoachStudent = {
  id: string
  displayName: string
  lastRecordDate: string | null
  streak: number
}

export type CoachTeam = {
  team: TeamSummary
  students: CoachStudent[]
}

export const fetchCoachTeamsWithStudents = async (
  coachId: string
): Promise<CoachTeam[]> => {
  const teams = await fetchTeamsForUser(coachId)
  if (teams.length === 0) return []

  const supabase = await createClient()
  const teamIds = teams.map((t) => t.id)

  type MemberRow = {
    team_id: string
    user_id: string
    profiles: { display_name: string | null } | { display_name: string | null }[] | null
  }

  const { data: members } = await supabase
    .from('team_members')
    .select('team_id, user_id, profiles ( display_name )')
    .in('team_id', teamIds)
    .eq('role_in_team', 'student')

  const memberRows = (members ?? []) as MemberRow[]
  const studentIds = Array.from(new Set(memberRows.map((m) => m.user_id)))

  if (studentIds.length === 0) {
    return teams.map((t) => ({ team: t, students: [] }))
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

  const pickProfile = (
    p: MemberRow['profiles']
  ): { display_name: string | null } | null =>
    Array.isArray(p) ? (p[0] ?? null) : (p ?? null)

  return teams.map((team) => {
    const rowsForTeam = memberRows.filter((m) => m.team_id === team.id)
    const students: CoachStudent[] = rowsForTeam.map((m) => {
      const sid = m.user_id
      const recordedSet = recentByStudent.get(sid) ?? new Set<string>()
      return {
        id: sid,
        displayName: pickProfile(m.profiles)?.display_name ?? '',
        lastRecordDate: lastByStudent.get(sid) ?? null,
        streak: calculateStreak(recordedSet),
      }
    })
    students.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
    return { team, students }
  })
}

export type CoachStudentDetail = {
  id: string
  displayName: string
  teamId: string
  teamName: string
}

export const fetchCoachStudent = async (
  coachId: string,
  studentId: string
): Promise<CoachStudentDetail | null> => {
  const supabase = await createClient()

  type Row = {
    team_id: string
    teams: { id: string; name: string } | { id: string; name: string }[] | null
  }

  const { data: coachTeams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', coachId)
    .eq('role_in_team', 'coach')

  const coachTeamIds = (coachTeams ?? []).map((r) => r.team_id as string)
  if (coachTeamIds.length === 0) return null

  const { data: studentRows } = await supabase
    .from('team_members')
    .select('team_id, teams ( id, name )')
    .eq('user_id', studentId)
    .eq('role_in_team', 'student')
    .in('team_id', coachTeamIds)

  const rows = (studentRows ?? []) as Row[]
  if (rows.length === 0) return null

  const first = rows[0]
  const team = Array.isArray(first.teams) ? first.teams[0] : first.teams
  if (!team) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', studentId)
    .maybeSingle()

  return {
    id: studentId,
    displayName: (profile?.display_name as string | null) ?? '',
    teamId: team.id,
    teamName: team.name,
  }
}

export const fetchStudentRecordedDates = async (
  studentId: string,
  year: number,
  month0: number
): Promise<Set<string>> => {
  const supabase = await createClient()
  const start = new Date(Date.UTC(year, month0 - 1, 25)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(year, month0 + 1, 7)).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('daily_records')
    .select('record_date')
    .eq('student_id', studentId)
    .gte('record_date', start)
    .lte('record_date', end)
  return new Set((data ?? []).map((r) => r.record_date as string))
}

export const fetchStudentRecentRecords = async (
  studentId: string,
  limit: number = 30
): Promise<{ recordDate: string }[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_records')
    .select('record_date')
    .eq('student_id', studentId)
    .order('record_date', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({ recordDate: r.record_date as string }))
}
