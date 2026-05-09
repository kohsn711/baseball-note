import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchDailyRecord, fetchRecordSocial } from '@/lib/daily-record'
import { fetchPresetComments } from '@/lib/social'
import { getJstParts } from '@/lib/date-jst'
import { requireRole } from '@/lib/current-user'
import { RecordDetailView, formatDateHeader } from '@/components/record-detail-view'
import { RecordSocial } from '@/components/record-social'

export const metadata = {
  title: '記録詳細 | 野球ノート',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date: rawDate } = await params

  const today = getJstParts().iso
  const recordDate = rawDate === 'today' ? today : rawDate
  if (!ISO_DATE.test(recordDate)) notFound()
  const [y, m, d] = recordDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) notFound()
  if (recordDate > today) notFound()

  const profile = await requireRole('student')

  const data = await fetchDailyRecord(profile.id, recordDate)
  if (!data.dailyRecordId) notFound()

  const [{ reactions, comments }, presetComments] = await Promise.all([
    fetchRecordSocial(data.dailyRecordId, 'student'),
    fetchPresetComments(),
  ])

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-slate-500">
          ← ホーム
        </Link>
        <Link
          href={`/records/${recordDate}`}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
        >
          編集
        </Link>
      </header>

      <h1 className="text-lg font-semibold text-slate-900">
        {formatDateHeader(recordDate)} の記録
      </h1>

      <RecordDetailView data={data} />

      <RecordSocial
        dailyRecordId={data.dailyRecordId}
        viewerId={profile.id}
        canInteract={false}
        reactions={reactions}
        comments={comments}
        presetComments={presetComments}
      />
    </div>
  )
}
