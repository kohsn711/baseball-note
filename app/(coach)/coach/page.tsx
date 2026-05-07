import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { fetchCoachTeamsWithStudents } from '@/lib/coach'

export const metadata = {
  title: '監督ダッシュボード | 野球ノート',
}

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) redirect('/setup')
  if (profile.role !== 'coach') redirect('/login')

  const teams = await fetchCoachTeamsWithStudents(userId)

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="space-y-1">
        <p className="text-xs text-slate-500">監督</p>
        <h1 className="text-lg font-semibold text-slate-900">{profile.display_name} さん</h1>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">所属チーム</h2>
          <Link href="/coach/team/create" className="text-xs text-slate-700 underline">
            新しく作る
          </Link>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだチームがありません。
            <Link href="/coach/team/create" className="ml-1 underline">
              チームを作成する
            </Link>
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

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">コンテンツ</h2>
            <p className="text-xs text-slate-500">監督向け記事を見る</p>
          </div>
          <Link
            href="/coach/contents"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            一覧を見る
          </Link>
        </div>
      </section>
    </div>
  )
}
