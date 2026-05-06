import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { fetchDailyRecord } from '@/lib/daily-record'
import { getJstParts } from '@/lib/date-jst'
import { BackLink } from './back-link'
import { RecordForm } from './record-form'

export const metadata = {
  title: '記録 | 野球ノート',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export default async function RecordPage({
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

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.role) redirect('/setup')
  if (profile.role !== 'student') redirect('/login')

  const data = await fetchDailyRecord(userId, recordDate)
  const isEditing = data.dailyRecordId !== null

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <BackLink href="/home" className="text-sm text-slate-500">
          ← ホーム
        </BackLink>
        <p className="text-xs text-slate-500">{isEditing ? '編集' : '新規'}</p>
      </header>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        {recordDate} の記録
      </h1>
      <RecordForm data={data} />
    </div>
  )
}