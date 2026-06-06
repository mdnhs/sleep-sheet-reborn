import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import SignupForm from './signup-form'

export default async function SignupPage() {
  const session = await getCurrentSession()
  if (session) redirect('/dashboard')

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">Create a store on the platform</p>
      <SignupForm />
    </div>
  )
}
