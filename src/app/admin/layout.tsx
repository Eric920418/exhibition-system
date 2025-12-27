import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/layout/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminLayoutClient userRole={session.user.role}>
        {children}
      </AdminLayoutClient>
    </div>
  )
}