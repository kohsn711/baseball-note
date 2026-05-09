import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { UserRole } from '@/lib/role'

export type CurrentUserProfile = {
  id: string
  email: string
  displayName: string
  role: UserRole
}

type CurrentUserState = {
  userId: string | null
  profile: CurrentUserProfile | null
}

const getCurrentUserState = cache(async (): Promise<CurrentUserState> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { userId: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) return { userId, profile: null }

  return {
    userId,
    profile: {
      id: userId,
      email: (claimsData.claims.email as string | undefined) ?? '',
      displayName: (profile.display_name as string | null) ?? '',
      role: profile.role as UserRole,
    },
  }
})

export const getCurrentUserProfile = cache(async (): Promise<CurrentUserProfile | null> => {
  const state = await getCurrentUserState()
  return state.profile
})

export const requireCurrentUserProfile = async (): Promise<CurrentUserProfile> => {
  const state = await getCurrentUserState()
  if (!state.userId) redirect('/login')
  if (!state.profile) redirect('/setup')
  return state.profile
}

export const requireRole = async (
  role: UserRole | readonly UserRole[]
): Promise<CurrentUserProfile> => {
  const state = await getCurrentUserState()
  if (!state.userId) redirect('/login')
  if (!state.profile) redirect('/setup')

  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(state.profile.role)) redirect('/login')
  return state.profile
}
