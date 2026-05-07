import 'server-only'
import { createClient } from '@/utils/supabase/server'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type Audience = 'student' | 'parent' | 'coach'

const AUDIENCE_COLUMN = {
  student: 'for_student',
  parent: 'for_parent',
  coach: 'for_coach',
} as const satisfies Record<Audience, string>

export type ContentListItem = {
  id: string
  title: string
  thumbnailUrl: string | null
  category: string | null
  publishedAt: string | null
}

export type ContentDetail = ContentListItem & {
  body: string
  externalVideoUrl: string | null
  forStudent: boolean
  forParent: boolean
  forCoach: boolean
}

export const fetchPublishedContents = async (
  audience: Audience,
  category?: string | null
): Promise<ContentListItem[]> => {
  const supabase = await createClient()
  let query = supabase
    .from('contents')
    .select('id, title, thumbnail_url, category, published_at')
    .eq('status', 'published')
    .eq(AUDIENCE_COLUMN[audience], true)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data } = await query
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    publishedAt: row.published_at,
  }))
}

export const fetchPublishedCategories = async (
  audience: Audience
): Promise<string[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contents')
    .select('category')
    .eq('status', 'published')
    .eq(AUDIENCE_COLUMN[audience], true)
    .not('category', 'is', null)

  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.category) set.add(row.category)
  }
  return Array.from(set).sort()
}

export const fetchContentDetail = async (
  id: string,
  audience: Audience
): Promise<ContentDetail | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contents')
    .select(
      'id, title, body, thumbnail_url, category, published_at, external_video_url, for_student, for_parent, for_coach, status'
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  if (data.status !== 'published') return null

  const audienceMatches = {
    student: data.for_student,
    parent: data.for_parent,
    coach: data.for_coach,
  }[audience]
  if (!audienceMatches) return null

  return {
    id: data.id,
    title: data.title,
    body: data.body,
    thumbnailUrl: data.thumbnail_url,
    category: data.category,
    publishedAt: data.published_at,
    externalVideoUrl: data.external_video_url,
    forStudent: data.for_student,
    forParent: data.for_parent,
    forCoach: data.for_coach,
  }
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com']

export const toYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (YOUTUBE_HOSTS.includes(u.hostname)) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const m = u.pathname.match(/^\/(embed|shorts)\/([^/?]+)/)
      if (m) return `https://www.youtube.com/embed/${m[2]}`
    }
    return null
  } catch {
    return null
  }
}

export const formatPublishedDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(d)
}
