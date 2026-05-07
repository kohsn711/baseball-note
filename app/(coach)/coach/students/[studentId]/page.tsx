import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  fetchCoachStudent,
  fetchStudentRecentRecords,
  fetchStudentRecordedDates,
} from '@/lib/coach'
import { getJstParts } from '@/lib/date-jst'
import { CoachCalendar } from '@/components/coach-calendar'

export const metadata = {
  title: '選手の記録 | 野球ノート',
}

const UUID = /^[0-9a-fA-F-]{36}$/

export default async function CoachStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { studentId } = await params
  if (!UUID.test(studentId)) notFound()

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
  if (profile.role !== 'coach') redirect('/login')

  const student = await fetchCoachStudent(userId, studentId)
  if (!student) notFound()

  const sp = await searchParams
  const today = getJstParts()
  const yearNum = sp.year ? Number(sp.year) : today.year
  const monthNum = sp.month ? Number(sp.month) : today.month + 1
  const year = Number.isFinite(yearNum) && yearNum >= 2020 && yearNum <= 2100 ? yearNum : today.year
  const month0 =
    Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12 ? monthNum - 1 : today.month

  const [monthDates, recent] = await Promise.all([
    fetchStudentRecordedDates(studentId, year, month0),
    fetchStudentRecentRecords(studentId, 30),
  ])

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link href="/coach" className="text-sm text-slate-500">
          ← ダッシュボード
        </Link>
        <Link
          href={`/coach/students/${studentId}/goals`}
          className="text-xs text-slate-700 underline"
        >
          目標を見る
        </Link>
      </header>

      <div className="space-y-1">
        <p className="text-xs text-slate-500">{student.teamName}</p>
        <h1 className="text-lg font-semibold text-slate-900">
          {student.displayName || '（名前未設定）'} さん
        </h1>
      </div>

      <CoachCalendar
        year={year}
        month0={month0}
        todayIso={today.iso}
        recordedDates={[...monthDates]}
        baseHref={`/coach/students/${studentId}`}
      />

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">直近の記録</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.recordDate}>
                <Link
                  href={`/coach/students/${studentId}/record/${r.recordDate}`}
                  className="block rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800"
                >
                  {r.recordDate}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
