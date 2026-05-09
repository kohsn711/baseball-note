import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchDailyRecord, fetchRecordSocial } from '@/lib/daily-record'
import { fetchPresetComments } from '@/lib/social'
import { fetchCoachStudent } from '@/lib/coach'
import { getJstParts } from '@/lib/date-jst'
import { requireRole } from '@/lib/current-user'
import { RecordDetailView, formatDateHeader } from '@/components/record-detail-view'
import { RecordSocial } from '@/components/record-social'

export const metadata = {
  title: '選手の記録詳細 | 野球ノート',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-fA-F-]{36}$/

export default async function CoachStudentRecordPage({
  params,
}: {
  params: Promise<{ studentId: string; date: string }>
}) {
  const { studentId, date: rawDate } = await params
  if (!UUID.test(studentId)) notFound()

  const today = getJstParts().iso
  const recordDate = rawDate
  if (!ISO_DATE.test(recordDate)) notFound()
  const [y, m, d] = recordDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) notFound()
  if (recordDate > today) notFound()

  const profile = await requireRole('coach')

  const student = await fetchCoachStudent(profile.id, studentId)
  if (!student) notFound()

  const data = await fetchDailyRecord(studentId, recordDate)
  if (!data.dailyRecordId) notFound()

  const [{ reactions, comments }, presetComments] = await Promise.all([
    fetchRecordSocial(data.dailyRecordId, 'coach'),
    fetchPresetComments(),
  ])

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link href={`/coach/students/${studentId}`} className="text-sm text-slate-500">
          ← {student.displayName || '選手'} の記録一覧
        </Link>
      </header>

      <div className="space-y-1">
        <p className="text-xs text-slate-500">
          {student.teamName} ・ {student.displayName || '（名前未設定）'} さん
        </p>
        <h1 className="text-lg font-semibold text-slate-900">
          {formatDateHeader(recordDate)} の記録
        </h1>
      </div>

      <RecordDetailView data={data} />

      <RecordSocial
        dailyRecordId={data.dailyRecordId}
        viewerId={profile.id}
        canInteract
        reactions={reactions}
        comments={comments}
        presetComments={presetComments}
      />
    </div>
  )
}
