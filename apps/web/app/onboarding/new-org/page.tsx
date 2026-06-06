import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import NewOrgForm from './new-org-form'

export default async function NewOrgPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <NewOrgForm />
    </div>
  )
}
