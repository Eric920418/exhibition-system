import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢用戶詳情
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      exhibitionsCreated: {
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      teamsLed: {
        select: {
          id: true,
          name: true,
          exhibition: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
        take: 5,
      },
      artworksCreated: {
        select: {
          id: true,
          title: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          exhibitionsCreated: true,
          teamsLed: true,
          artworksCreated: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/admin/users')
  }

  // 檢查權限（超級管理員或本人可以查看）
  if (session.user.role !== 'SUPER_ADMIN' && session.user.id !== id) {
    redirect('/admin/users')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' || session.user.id === id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.isActive ? '啟用' : '停用'}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/users/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯用戶
            </Link>
          )}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">角色</h3>
          <p className="text-2xl font-bold text-gray-800">
            {user.role === 'SUPER_ADMIN'
              ? '超級管理員'
              : user.role === 'CURATOR'
              ? '策展人'
              : '組長'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">創建展覽</h3>
          <p className="text-2xl font-bold text-gray-800">
            {user._count.exhibitionsCreated}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">領導團隊</h3>
          <p className="text-2xl font-bold text-gray-800">
            {user._count.teamsLed}
          </p>
        </div>
      </div>

      {/* 詳細信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">詳細信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">註冊時間</h3>
            <p className="text-gray-800">
              {new Date(user.createdAt).toLocaleString('zh-TW')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">最後更新</h3>
            <p className="text-gray-800">
              {new Date(user.updatedAt).toLocaleString('zh-TW')}
            </p>
          </div>
        </div>
      </div>

      {/* 創建的展覽 */}
      {user.exhibitionsCreated.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">創建的展覽</h2>
          <div className="space-y-3">
            {user.exhibitionsCreated.map((exhibition) => (
              <div
                key={exhibition.id}
                className="flex justify-between items-center border-b border-gray-200 pb-3"
              >
                <div>
                  <Link
                    href={`/admin/exhibitions/${exhibition.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {exhibition.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {exhibition.year} 年 ·{' '}
                    {new Date(exhibition.createdAt).toLocaleDateString('zh-TW')}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    exhibition.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : exhibition.status === 'DRAFT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {exhibition.status === 'PUBLISHED'
                    ? '已發布'
                    : exhibition.status === 'DRAFT'
                    ? '草稿'
                    : '已歸檔'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 領導的團隊 */}
      {user.teamsLed.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">領導的團隊</h2>
          <div className="space-y-3">
            {user.teamsLed.map((team) => (
              <div
                key={team.id}
                className="flex justify-between items-center border-b border-gray-200 pb-3"
              >
                <div>
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {team.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {team.exhibition.name} ({team.exhibition.year})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 創建的作品 */}
      {user.artworksCreated.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">創建的作品</h2>
          <div className="space-y-3">
            {user.artworksCreated.map((artwork) => (
              <div
                key={artwork.id}
                className="flex justify-between items-center border-b border-gray-200 pb-3"
              >
                <div>
                  <Link
                    href={`/admin/artworks/${artwork.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {artwork.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {artwork.team.name} ·{' '}
                    {new Date(artwork.createdAt).toLocaleDateString('zh-TW')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
