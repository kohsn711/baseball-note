import { redirect } from 'next/navigation'
import { getPostLoginPath } from '@/lib/auth'

export default async function Home() {
  redirect(await getPostLoginPath())
}
