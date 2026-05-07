import Link from 'next/link'
import {
  fetchPublishedCategories,
  fetchPublishedContents,
} from '@/lib/contents'
import { ContentsList } from '@/components/contents-list'

export const metadata = {
  title: 'コンテンツ | 野球ノート',
}

type SearchParams = Promise<{ category?: string }>

export default async function CoachContentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category } = await searchParams
  const selected = category ?? null

  const [items, categories] = await Promise.all([
    fetchPublishedContents('coach', selected),
    fetchPublishedCategories('coach'),
  ])

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">コンテンツ</h1>
        <Link href="/coach" className="text-xs text-slate-500 underline">
          ホーム
        </Link>
      </header>

      <ContentsList
        basePath="/coach/contents"
        items={items}
        categories={categories}
        selectedCategory={selected}
      />
    </div>
  )
}
