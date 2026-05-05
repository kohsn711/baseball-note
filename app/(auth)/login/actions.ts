'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPostLoginPath } from '@/lib/auth'

export type ActionState = { error?: string } | undefined

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// メールアドレス入力 → OTP送信
export const sendOtp = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const email = String(formData.get('email') ?? '').trim()
  if (!isValidEmail(email)) {
    return { error: 'メールアドレスの形式が正しくありません。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    return { error: '認証コードの送信に失敗しました。時間をおいて再度お試しください。' }
  }

  redirect(`/login/verify?email=${encodeURIComponent(email)}`)
}

// 6桁コード検証 → ロール別ホームへ
export const verifyOtp = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const email = String(formData.get('email') ?? '').trim()
  const token = String(formData.get('token') ?? '').trim()

  if (!isValidEmail(email)) return { error: 'メールアドレスが不正です。' }
  if (!/^\d{6}$/.test(token)) return { error: '6桁の数字を入力してください。' }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: '認証コードが正しくありません。再度入力してください。' }
  }

  const next = await getPostLoginPath()
  redirect(next)
}

// ログアウト
export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
