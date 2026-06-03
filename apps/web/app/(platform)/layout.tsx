import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect('/login?redirect=/admin')

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail || session.user.email !== superAdminEmail) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
