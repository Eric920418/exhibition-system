import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserForm from '@/components/forms/UserForm'

export default async function NewUserPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 僅超級管理員可以創建用戶
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">新增用戶</h1>
        <p className="text-gray-600 mt-2">創建新的系統用戶</p>
      </div>

      <UserForm mode="create" />
    </div>
  )
}
