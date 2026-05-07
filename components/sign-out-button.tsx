import { signOut } from '@/lib/auth-actions'

export const SignOutButton = () => (
  <form action={signOut}>
    <button
      type="submit"
      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      ログアウト
    </button>
  </form>
)
