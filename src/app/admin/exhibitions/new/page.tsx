import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExhibitionForm from '@/components/forms/ExhibitionForm'

export default async function NewExhibitionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 檢查權限（僅 SUPER_ADMIN 和 CURATOR 可以創建展覽）
  if (!['SUPER_ADMIN', 'CURATOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">新增展覽</h1>
        <p className="text-gray-600 mt-2">創建一個新的展覽項目</p>
      </div>

      <ExhibitionForm mode="create" />
    </div>
  )
}
