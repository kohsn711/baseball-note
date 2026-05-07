'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPostLoginPath } from '@/lib/auth'

export type ActionState =
  | { step: 'otp'; email: string; error?: string }
  | { error?: string }
  | undefined

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const signInWithPassword = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const email    = String(formData.get('email')    ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!isValidEmail(email)) {
    return { error: 'メールアドレスの形式が正しくありません。' }
  }
  if (!password) {
    return { error: 'パスワードを入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません。' }
  }

  const next = await getPostLoginPath()
  redirect(next)
}

export const sendLoginOtp = async (
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
    options: { shouldCreateUser: false },
  })

  if (error) {
    return { error: '認証コードの送信に失敗しました。メールアドレスを確認してください。' }
  }

  return { step: 'otp', email }
}

export const verifyLoginOtp = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const email = String(formData.get('email') ?? '').trim()
  const token = String(formData.get('token') ?? '').trim()

  if (!isValidEmail(email)) {
    return { error: 'メールアドレスが不正です。' }
  }
  if (!token) {
    return { error: '認証コードを入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) {
    return { step: 'otp', email, error: '認証コードが正しくありません。コードを確認して再度お試しください。' }
  }

  const next = await getPostLoginPath()
  redirect(next)
}

export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
