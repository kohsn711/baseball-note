'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export const approveParentLink = async (formData: FormData): Promise<void> => {
  const linkId = String(formData.get('link_id') ?? '')
  if (!linkId) return

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined)?.toLowerCase()
  if (!userId) redirect('/login')
  if (!userEmail) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (profile?.role !== 'parent') redirect('/login')

  // RLS が pending かつ invited_email 一致を要求するため、対象が違う場合は更新されない
  await supabase
    .from('parent_child_links')
    .update({ parent_id: userId, status: 'active' })
    .eq('id', linkId)
    .eq('status', 'pending')
    .eq('invited_email', userEmail)

  revalidatePath('/parent/links')
}

export const rejectParentLink = async (formData: FormData): Promise<void> => {
  const linkId = String(formData.get('link_id') ?? '')
  if (!linkId) return

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined)?.toLowerCase()
  if (!userId) redirect('/login')
  if (!userEmail) return

  await supabase
    .from('parent_child_links')
    .delete()
    .eq('id', linkId)
    .eq('status', 'pending')
    .eq('invited_email', userEmail)

  revalidatePath('/parent/links')
}
