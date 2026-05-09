import Link from 'next/link'
import { fetchCoachTeamsWithStudents } from '@/lib/coach'
import { requireRole } from '@/lib/current-user'
import { PageHeader } from '@/components/page-header'

export const metadata = {
  title: '監督ダッシュボード | 野球ノート',
}

export default async function CoachDashboardPage() {
  const profile = await requireRole('coach')

  const teams = await fetchCoachTeamsWithStudents(profile.id)

  return (
    <>
      <PageHeader>
        <div>
          <p className="text-xs text-slate-500">監督</p>
          <p className="text-base font-semibold text-slate-900">{profile.displayName} さん</p>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">所属チーム</h2>

        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだチームがありません。マイページからチームを作成できます。
          </p>
        ) : (
          <ul className="space-y-4">
            {teams.map(({ team, students }) => (
              <li key={team.id} className="rounded-lg bg-slate-50 px-3 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{team.name}</p>
                  <p className="font-mono text-sm tracking-widest text-slate-700">
                    {team.teamCode}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  選手 {students.length} 人
                </p>

                {students.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    まだ参加している選手はいません。チームコードを学生に共有してください。
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {students.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/coach/students/${s.id}`}
                          className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {s.displayName || '（名前未設定）'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.lastRecordDate
                                ? `最終記録 ${s.lastRecordDate}`
                                : 'まだ記録なし'}
                            </p>
                          </div>
                          <div className="ml-3 shrink-0 text-right">
                            <p className="text-xs text-slate-500">連続</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {s.streak}
                              <span className="ml-0.5 text-xs font-normal text-slate-500">日</span>
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </>
  )
}
