import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import LoginForm from './login-form'

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession()
  if (session) redirect('/dashboard')

  const { redirect: redirectTo } = await searchParams

  return <LoginForm redirectTo={redirectTo ?? '/dashboard'} />
}
