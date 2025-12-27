import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UserForm from '@/components/forms/UserForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢用戶
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
    },
  })

  if (!user) {
    redirect('/admin/users')
  }

  // 檢查權限（超級管理員或本人可以編輯）
  if (session.user.role !== 'SUPER_ADMIN' && session.user.id !== id) {
    redirect('/admin/users')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">編輯用戶</h1>
        <p className="text-gray-600 mt-2">{user.name}</p>
      </div>

      <UserForm mode="edit" user={user} />
    </div>
  )
}
