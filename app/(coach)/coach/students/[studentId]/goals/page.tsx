import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { fetchCoachStudent } from '@/lib/coach'
import { fetchGoalsByStatus } from '@/lib/goals'
import { GOAL_CATEGORY_LABEL, GOAL_STATUS_LABEL } from '@/lib/goals-constants'

export const metadata = {
  title: '選手の目標 | 野球ノート',
}

const UUID = /^[0-9a-fA-F-]{36}$/

export default async function CoachStudentGoalsPage({
  params,
}: {
  params: Promise<{ studentId: string }>
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

  const [activeGoals, achievedGoals] = await Promise.all([
    fetchGoalsByStatus(studentId, 'active'),
    fetchGoalsByStatus(studentId, 'achieved'),
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
        <h1 className="text-lg font-semibold text-slate-900">目標</h1>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          {GOAL_STATUS_LABEL.active}
        </h2>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-slate-500">取り組み中の目標はありません。</p>
        ) : (
          <ul className="space-y-2">
            {activeGoals.map((g) => (
              <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{g.title}</p>
                <p className="text-xs text-slate-500">
                  {GOAL_CATEGORY_LABEL[g.category]}
                  {g.targetDate && ` ・ 目標日 ${g.targetDate}`}
                </p>
                {g.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                    {g.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {achievedGoals.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            {GOAL_STATUS_LABEL.achieved}
          </h2>
          <ul className="space-y-2">
            {achievedGoals.map((g) => (
              <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{g.title}</p>
                <p className="text-xs text-slate-500">
                  {GOAL_CATEGORY_LABEL[g.category]}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
