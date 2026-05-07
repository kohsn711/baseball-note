export type UserRole = 'student' | 'coach' | 'parent' | 'admin'

// 各ロールのホームパス。ルートグループ `(role)` はURLに含まれないため明示的にマップする
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  student: '/home',
  coach: '/coach',
  parent: '/parent',
  admin: '/admin',
}

export const roleHomePath = (role: string | null | undefined): string => {
  if (role && role in ROLE_HOME_PATH) {
    return ROLE_HOME_PATH[role as UserRole]
  }
  return '/setup'
}