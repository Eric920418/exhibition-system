import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  page?: string
  search?: string
  role?: string
  isActive?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // 僅超級管理員可以訪問
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const params = await searchParams

  // 解析查詢參數
  const page = Number(params.page) || 1
  const search = params.search || ''
  const role = params.role || undefined
  const isActive =
    params.isActive === 'true'
      ? true
      : params.isActive === 'false'
      ? false
      : undefined
  const limit = 20

  // 構建查詢條件
  const where: any = {}

  if (role) {
    where.role = role
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  // 查詢數據
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            exhibitionsCreated: true,
            teamsLed: true,
            artworksCreated: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      {/* 標題和操作按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">用戶管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 個用戶</p>
        </div>
        <Link
          href="/admin/users/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增用戶
        </Link>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="搜尋姓名或郵箱..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            name="role"
            defaultValue={role || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有角色</option>
            <option value="SUPER_ADMIN">超級管理員</option>
            <option value="CURATOR">策展人</option>
            <option value="TEAM_LEADER">組長</option>
          </select>
          <select
            name="isActive"
            defaultValue={
              isActive === true ? 'true' : isActive === false ? 'false' : ''
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有狀態</option>
            <option value="true">啟用</option>
            <option value="false">停用</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            搜尋
          </button>
        </form>
      </div>

      {/* 用戶列表 - 桌面版表格 */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用戶
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                創建展覽
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                領導團隊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                創建作品
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatarUrl ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.avatarUrl}
                          alt={user.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'CURATOR'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role === 'SUPER_ADMIN'
                      ? '超級管理員'
                      : user.role === 'CURATOR'
                      ? '策展人'
                      : '組長'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.exhibitionsCreated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.teamsLed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.artworksCreated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    查看
                  </Link>
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    編輯
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合條件的用戶</p>
          </div>
        )}
      </div>

      {/* 用戶列表 - 移動端卡片 */}
      <div className="md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">沒有找到符合條件的用戶</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user.avatarUrl ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.avatarUrl}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? '啟用' : '停用'}
                </span>
              </div>
              <div className="text-sm">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'CURATOR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {user.role === 'SUPER_ADMIN'
                    ? '超級管理員'
                    : user.role === 'CURATOR'
                    ? '策展人'
                    : '組長'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-gray-100 pt-3">
                <div>
                  <p className="font-semibold text-gray-800">{user._count.exhibitionsCreated}</p>
                  <p className="text-xs text-gray-500">展覽</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user._count.teamsLed}</p>
                  <p className="text-xs text-gray-500">團隊</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user._count.artworksCreated}</p>
                  <p className="text-xs text-gray-500">作品</p>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  查看
                </Link>
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  編輯
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/admin/users?page=${pageNum}${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}${isActive !== undefined ? `&isActive=${isActive}` : ''}`}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
