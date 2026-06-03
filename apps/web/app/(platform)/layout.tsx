import { redirect } from 'next/navigation'

// TODO: replace with Better Auth SUPER_ADMIN check
async function getPlatformUser() {
  return null
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getPlatformUser()
  if (!user) redirect('/admin/login')
  return <>{children}</>
}
