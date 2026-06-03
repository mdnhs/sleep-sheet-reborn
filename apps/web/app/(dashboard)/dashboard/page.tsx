import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-server'
import DashboardClientLoader from './dashboard-client-loader'

export default async function DashboardPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  return <DashboardClientLoader />
}
