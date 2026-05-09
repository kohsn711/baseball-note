import {
  fetchPublishedCategories,
  fetchPublishedContents,
} from '@/lib/contents'
import { requireRole } from '@/lib/current-user'
import { ContentsList } from '@/components/contents-list'
import { PageHeader } from '@/components/page-header'

export const metadata = {
  title: 'コンテンツ | 野球ノート',
}

type SearchParams = Promise<{ category?: string }>

export default async function ParentContentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireRole('parent')
  const { category } = await searchParams
  const selected = category ?? null

  const [items, categories] = await Promise.all([
    fetchPublishedContents('parent', selected),
    fetchPublishedCategories('parent'),
  ])

  return (
    <>
      <PageHeader>
        <h1 className="text-base font-semibold text-slate-900">コンテンツ</h1>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
        <ContentsList
          basePath="/parent/contents"
          items={items}
          categories={categories}
          selectedCategory={selected}
        />
      </div>
    </>
  )
}
