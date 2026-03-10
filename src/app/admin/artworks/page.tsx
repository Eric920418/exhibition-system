import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  page?: string
  search?: string
  teamId?: string
  exhibitionId?: string
  isPublished?: string
}

export default async function ArtworksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // 解析查詢參數
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const teamId = params.teamId || undefined
  const exhibitionId = params.exhibitionId || undefined
  const isPublished =
    params.isPublished === 'true'
      ? true
      : params.isPublished === 'false'
      ? false
      : undefined
  const limit = 12

  // 構建查詢條件
  const where: any = {}

  if (teamId) {
    where.teamId = teamId
  }

  if (exhibitionId) {
    where.team = {
      exhibitionId,
    }
  }

  if (isPublished !== undefined) {
    where.isPublished = isPublished
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { concept: { contains: search, mode: 'insensitive' } },
    ]
  }

  // 查詢數據
  const [total, artworks] = await Promise.all([
    prisma.artwork.count({ where }),
    prisma.artwork.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        team: {
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
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // 獲取展覽列表用於篩選
  const exhibitions = await prisma.exhibition.findMany({
    select: {
      id: true,
      name: true,
      year: true,
    },
    orderBy: { year: 'desc' },
    take: 20,
  })

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      {/* 標題和操作按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">作品管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 件作品</p>
        </div>
        <Link
          href="/admin/artworks/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增作品
        </Link>
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="搜尋作品名稱或概念..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            name="exhibitionId"
            defaultValue={exhibitionId || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有展覽</option>
            {exhibitions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.year})
              </option>
            ))}
          </select>
          <select
            name="isPublished"
            defaultValue={
              isPublished === true ? 'true' : isPublished === false ? 'false' : ''
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有狀態</option>
            <option value="true">已發布</option>
            <option value="false">未發布</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            搜尋
          </button>
        </form>
      </div>

      {/* 作品網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.map((artwork) => (
          <Link
            key={artwork.id}
            href={`/admin/artworks/${artwork.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {artwork.thumbnailUrl ? (
                <img
                  src={artwork.thumbnailUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-20 h-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {!artwork.isPublished && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  未發布
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-1 truncate">
                {artwork.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {artwork.team.name}
              </p>
              <p className="text-xs text-gray-500">
                {artwork.team.exhibition.name} ({artwork.team.exhibition.year})
              </p>
              {artwork.concept && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {artwork.concept}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {artworks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">沒有找到符合條件的作品</p>
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
                  href={`/admin/artworks?page=${pageNum}${search ? `&search=${search}` : ''}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}${isPublished !== undefined ? `&isPublished=${isPublished}` : ''}`}
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
