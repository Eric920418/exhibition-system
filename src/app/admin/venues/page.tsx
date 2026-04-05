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

export default async function VenuesPage({
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
  const [total, venues] = await Promise.all([
    prisma.venue.count({ where }),
    prisma.venue.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { exhibition: { year: 'desc' } },
        { name: 'asc' },
      ],
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">場地管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 個場地</p>
        </div>
        <Link
          href="/admin/venues/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增場地
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

      {/* 場地網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            href={`/admin/venues/${venue.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            {/* 平面圖預覽 */}
            {venue.floorPlanUrl ? (
              <div className="h-32 mb-4 bg-gray-50 rounded overflow-hidden">
                <img
                  src={venue.floorPlanUrl}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center mb-4 bg-gray-100 rounded">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {venue.name}
              </h3>
              {venue.address && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  <svg
                    className="w-4 h-4 inline mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {venue.address}
                </p>
              )}
              {venue.capacity && (
                <p className="text-sm text-gray-600 mb-2">
                  容納人數：{venue.capacity} 人
                </p>
              )}
              <p className="text-sm text-gray-500">
                {venue.exhibition.name} ({venue.exhibition.year})
              </p>
            </div>
          </Link>
        ))}
      </div>

      {venues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">沒有找到符合條件的場地</p>
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
                  href={`/admin/venues?page=${pageNum}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}`}
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
