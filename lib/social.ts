import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type PresetComment = {
  id: string
  text: string
}

export const fetchPresetComments = async (): Promise<PresetComment[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preset_comments')
    .select('id, text')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return (data ?? []) as PresetComment[]
}
