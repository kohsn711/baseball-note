'use server'

import { createClient } from '@/utils/supabase/server'
import { requireRole } from '@/lib/current-user'

export const markNotificationsRead = async (): Promise<void> => {
  const profile = await requireRole('student')
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)
}
