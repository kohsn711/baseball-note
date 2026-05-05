import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { roleHomePath } from '@/lib/role'
import { SetupForm } from './setup-form'

export const metadata = {
  title: '初期設定 | 野球ノート',
}

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role) redirect(roleHomePath(profile.role))

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">初期設定</h1>
          <p className="text-sm text-slate-600">
            プロフィールを入力して始めましょう。
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  )
}
