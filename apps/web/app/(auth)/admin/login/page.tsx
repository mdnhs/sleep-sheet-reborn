import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import LoginForm from '../../login/login-form'

interface AdminLoginPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await getCurrentSession()
  if (session) redirect('/admin')

  const { redirect: redirectTo } = await searchParams

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">Platform administrator sign in</p>
      <LoginForm redirectTo={redirectTo ?? '/admin'} />
    </div>
  )
}
