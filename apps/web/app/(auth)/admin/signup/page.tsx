import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import AdminSignupForm from './signup-form'

export default async function AdminSignupPage() {
  const session = await getCurrentSession()
  if (session) redirect('/admin')

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">Platform administrator registration</p>
      <AdminSignupForm />
    </div>
  )
}
