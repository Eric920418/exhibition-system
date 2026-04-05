export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOrSet, CACHE_TTL, adminExhibitionDropdownKey } from '@/lib/cache'

interface SearchParams {
  page?: string
  exhibitionId?: string
}

export default async function TeamsPage({
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
  const exhibitionId = params.exhibitionId || undefined
  const limit = 12

  // 構建查詢條件
  const where: any = {}
  if (exhibitionId) {
    where.exhibitionId = exhibitionId
  }

  // 查詢數據
  const [total, teams] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { exhibition: { year: 'desc' } },
        { displayOrder: 'asc' },
      ],
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            artworks: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // 獲取展覽列表用於篩選（Redis 快取 5 分鐘）
  const exhibitions = await getOrSet(
    adminExhibitionDropdownKey(),
    () => prisma.exhibition.findMany({
      select: { id: true, name: true, year: true },
      orderBy: { year: 'desc' },
      take: 20,
    }),
    CACHE_TTL.MEDIUM
  )

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      {/* 標題和操作按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">團隊管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 個團隊</p>
        </div>
        <Link
          href="/admin/teams/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增團隊
        </Link>
      </div>

      {/* 篩選 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="get" className="flex gap-4">
          <select
            name="exhibitionId"
            defaultValue={exhibitionId || ''}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有展覽</option>
            {exhibitions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.year})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            篩選
          </button>
        </form>
      </div>

      {/* 團隊網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/admin/teams/${team.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500">{team.slug}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {team.exhibition.name} ({team.exhibition.year})
            </p>
            {team.leader && (
              <p className="text-sm text-gray-500 mb-3">
                組長：{team.leader.name}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {team._count.members} 名成員
              </span>
              <span className="text-gray-600">
                {team._count.artworks} 件作品
              </span>
            </div>
            {team.description && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {team.description}
              </p>
            )}
          </Link>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">沒有找到符合條件的團隊</p>
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/admin/teams?page=${pageNum}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}`}
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
