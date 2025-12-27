import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/ui/export-button'

interface SearchParams {
  page?: string
  search?: string
  year?: string
  status?: string
}

export default async function ExhibitionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams

  // 解析查詢參數
  const page = Number(params.page) || 1
  const search = params.search || ''
  const year = params.year ? Number(params.year) : undefined
  const status = params.status || undefined
  const limit = 10

  // 構建查詢條件
  const where: any = {}

  if (year) {
    where.year = year
  }

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  // 查詢數據
  const [total, exhibitions] = await Promise.all([
    prisma.exhibition.count({ where }),
    prisma.exhibition.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { year: 'desc' },
        { startDate: 'desc' },
      ],
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            teams: true,
            members: true,
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">展覽管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 個展覽</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ExportButton
            endpoint="/api/exhibitions/export"
            params={{ year: year?.toString(), status }}
            label="匯出"
          />
          {['SUPER_ADMIN', 'CURATOR'].includes(session.user.role) && (
            <Link
              href="/admin/exhibitions/new"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新增展覽
            </Link>
          )}
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="搜尋展覽名稱或描述..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            name="year"
            defaultValue={year || ''}
            placeholder="年份"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            name="status"
            defaultValue={status || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有狀態</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已發布</option>
            <option value="ARCHIVED">已歸檔</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            搜尋
          </button>
        </form>
      </div>

      {/* 展覽列表 - 桌面版表格 */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  展覽名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年份
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  團隊數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  創建者
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exhibitions.map((exhibition) => (
                <tr key={exhibition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {exhibition.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {exhibition.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exhibition.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(exhibition.startDate).toLocaleDateString('zh-TW')}
                    </div>
                    <div className="text-sm text-gray-500">
                      至 {new Date(exhibition.endDate).toLocaleDateString('zh-TW')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        exhibition.status === 'PUBLISHED'
                          ? 'default'
                          : exhibition.status === 'DRAFT'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {exhibition.status === 'PUBLISHED'
                        ? '已發布'
                        : exhibition.status === 'DRAFT'
                        ? '草稿'
                        : '已歸檔'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exhibition._count.teams} 個團隊
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {exhibition.creator?.name || '未知'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/exhibitions/${exhibition.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      查看
                    </Link>
                    {(session.user.role === 'SUPER_ADMIN' ||
                      exhibition.createdBy === session.user.id) && (
                      <Link
                        href={`/admin/exhibitions/${exhibition.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        編輯
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exhibitions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合條件的展覽</p>
          </div>
        )}
      </div>

      {/* 展覽列表 - 移動端卡片 */}
      <div className="md:hidden space-y-4">
        {exhibitions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">沒有找到符合條件的展覽</p>
          </div>
        ) : (
          exhibitions.map((exhibition) => (
            <div
              key={exhibition.id}
              className="bg-white rounded-lg shadow p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{exhibition.name}</h3>
                  <p className="text-sm text-gray-500">{exhibition.slug}</p>
                </div>
                <Badge
                  variant={
                    exhibition.status === 'PUBLISHED'
                      ? 'default'
                      : exhibition.status === 'DRAFT'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {exhibition.status === 'PUBLISHED'
                    ? '已發布'
                    : exhibition.status === 'DRAFT'
                    ? '草稿'
                    : '已歸檔'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">年份：</span>
                  <span className="text-gray-900">{exhibition.year}</span>
                </div>
                <div>
                  <span className="text-gray-500">團隊：</span>
                  <span className="text-gray-900">{exhibition._count.teams} 個</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">日期：</span>
                  <span className="text-gray-900">
                    {new Date(exhibition.startDate).toLocaleDateString('zh-TW')} -{' '}
                    {new Date(exhibition.endDate).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">
                <Link
                  href={`/admin/exhibitions/${exhibition.id}`}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  查看
                </Link>
                {(session.user.role === 'SUPER_ADMIN' ||
                  exhibition.createdBy === session.user.id) && (
                  <Link
                    href={`/admin/exhibitions/${exhibition.id}/edit`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    編輯
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/admin/exhibitions?page=${pageNum}${search ? `&search=${search}` : ''}${year ? `&year=${year}` : ''}${status ? `&status=${status}` : ''}`}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNum === page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
