import 'server-only'
import { createClient } from '@/utils/supabase/server'

const TEAM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TEAM_CODE_LENGTH = 6
const TEAM_CODE_MAX_ATTEMPTS = 8

export const TEAM_CODE_PATTERN = /^[A-Z2-9]{6,8}$/

export const generateTeamCode = (length: number = TEAM_CODE_LENGTH): string => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += TEAM_CODE_ALPHABET[bytes[i] % TEAM_CODE_ALPHABET.length]
  }
  return out
}

export type TeamSummary = {
  id: string
  name: string
  teamCode: string
}

export const fetchTeamsForUser = async (userId: string): Promise<TeamSummary[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams ( id, name, team_code )')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  if (error || !data) return []

  type TeamRow = { id: string; name: string; team_code: string }
  type Row = { teams: TeamRow | TeamRow[] | null }

  return (data as unknown as Row[])
    .map((row) => {
      const team = Array.isArray(row.teams) ? (row.teams[0] ?? null) : row.teams
      if (!team) return null
      return { id: team.id, name: team.name, teamCode: team.team_code }
    })
    .filter((t): t is TeamSummary => t !== null)
}

export { TEAM_CODE_MAX_ATTEMPTS }
