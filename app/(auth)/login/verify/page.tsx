import Link from 'next/link'
import { redirect } from 'next/navigation'
import { VerifyForm } from './verify-form'

export const metadata = {
  title: '認証コード入力 | 野球ノート',
}

// Next.js 16: searchParams は Promise
type Props = { searchParams: Promise<{ email?: string }> }

export default async function VerifyPage({ searchParams }: Props) {
  const { email } = await searchParams
  if (!email) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">認証コード入力</h1>
        <p className="text-sm text-slate-600">
          <span className="font-medium">{email}</span> 宛に届いた6桁のコードを入力してください。
        </p>
      </div>

      <VerifyForm email={email} />

      <p className="text-center text-sm">
        <Link href="/login" className="text-slate-600 underline">
          メールアドレスを変更する
        </Link>
      </p>
    </div>
  )
}
