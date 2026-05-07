import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { roleHomePath } from '@/lib/role'
import { SetupForm } from './setup-form'
import { ParentSetupForm } from './parent-setup-form'

export const metadata = {
  title: '初期設定 | 野球ノート',
}

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined) ?? null
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role) redirect(roleHomePath(profile.role))

  // 保護者として招待されている場合は保護者用フォームを表示
  let isInvitedParent = false
  if (userEmail) {
    const { data: invites } = await supabase
      .from('parent_child_links')
      .select('id')
      .eq('status', 'pending')
      .is('parent_id', null)
      .eq('invited_email', userEmail.toLowerCase())
      .limit(1)
    isInvitedParent = !!invites && invites.length > 0
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">初期設定</h1>
          <p className="text-sm text-slate-600">
            {isInvitedParent
              ? 'お子さまから保護者として招待されています。お名前を入力してください。'
              : 'プロフィールを入力して始めましょう。'}
          </p>
        </div>
        {isInvitedParent ? <ParentSetupForm /> : <SetupForm />}
      </div>
    </div>
  )
}
