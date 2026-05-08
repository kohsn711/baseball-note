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
          メールアドレスでログインします。パスワードまたは認証コードを選択してください。
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
