export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Calendar } from 'lucide-react'

interface SearchParams {
  page?: string
  exhibitionId?: string
}

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const exhibitionId = params.exhibitionId || undefined
  const limit = 12

  // 構建查詢條件
  const where: any = {}
  if (exhibitionId) {
    where.exhibitionId = exhibitionId
  }

  // 獲取所有展覽供篩選
  const exhibitions = await prisma.exhibition.findMany({
    where: { status: { in: ['DRAFT', 'PUBLISHED'] } },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      year: true,
    },
  })

  // 查詢數據
  const [total, boards] = await Promise.all([
    prisma.board.count({ where }),
    prisma.board.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { cards: true },
            },
          },
        },
        _count: {
          select: { lists: true },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // 計算每個看板的總卡片數
  const boardsWithCardCount = boards.map((board) => ({
    ...board,
    totalCards: board.lists.reduce((sum, list) => sum + list._count.cards, 0),
  }))

  return (
    <div className="p-8">
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">任務看板</h1>
          <p className="text-gray-600 mt-2">共 {total} 個看板</p>
        </div>
        <Link href="/admin/boards/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增看板
          </Button>
        </Link>
      </div>

      {/* 篩選 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="get" className="flex gap-4">
          <select
            name="exhibitionId"
            defaultValue={exhibitionId || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">所有展覽</option>
            {exhibitions.map((exhibition) => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.name} ({exhibition.year})
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            篩選
          </Button>
          {exhibitionId && (
            <Link href="/admin/boards">
              <Button type="button" variant="outline">
                清除篩選
              </Button>
            </Link>
          )}
        </form>
      </div>

      {/* 看板網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boardsWithCardCount.map((board) => (
          <Link
            key={board.id}
            href={`/admin/boards/${board.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="secondary">
                {board.exhibition.year}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              {board.name}
            </h3>

            {board.description && (
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {board.description}
              </p>
            )}

            <div className="text-sm text-gray-500 mb-3">
              {board.exhibition.name}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-gray-600">
                  <strong className="text-gray-800">{board._count.lists}</strong> 列表
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-800">{board.totalCards}</strong> 卡片
                </span>
              </div>
            </div>

            {/* 列表預覽 */}
            {board.lists.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2 overflow-hidden">
                  {board.lists.slice(0, 4).map((list) => (
                    <div
                      key={list.id}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 truncate max-w-[100px]"
                      title={list.title}
                    >
                      {list.title}
                    </div>
                  ))}
                  {board.lists.length > 4 && (
                    <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      +{board.lists.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">還沒有看板</h3>
          <p className="text-gray-500 mb-4">創建一個新的看板來管理您的任務</p>
          <Link href="/admin/boards/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              創建第一個看板
            </Button>
          </Link>
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/admin/boards?page=${pageNum}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}`}
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
