import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchContentDetail } from '@/lib/contents'
import { requireRole } from '@/lib/current-user'
import { ContentDetailView } from '@/components/content-detail'

type Params = Promise<{ id: string }>

export const generateMetadata = async ({ params }: { params: Params }) => {
  const { id } = await params
  const content = await fetchContentDetail(id, 'student')
  return {
    title: content ? `${content.title} | 野球ノート` : 'コンテンツ | 野球ノート',
  }
}

export default async function StudentContentDetailPage({
  params,
}: {
  params: Params
}) {
  await requireRole('student')
  const { id } = await params
  const content = await fetchContentDetail(id, 'student')
  if (!content) notFound()

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <Link href="/contents" className="text-xs text-slate-500 underline">
        ← コンテンツ一覧
      </Link>
      <ContentDetailView content={content} />
    </div>
  )
}
