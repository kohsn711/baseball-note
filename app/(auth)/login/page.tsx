import { LoginForm } from './login-form'

export const metadata = {
  title: 'ログイン | 野球ノート',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">ログイン</h1>
        <p className="text-sm text-slate-600">
          メールアドレスに6桁の認証コードを送ります。
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
