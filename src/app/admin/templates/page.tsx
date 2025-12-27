import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  exhibitionId?: string
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // 檢查權限：只有超級管理員和策展人可以訪問
  if (!['SUPER_ADMIN', 'CURATOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  const params = await searchParams
  const exhibitionId = params.exhibitionId || undefined

  // 構建查詢條件
  const where: any = {}

  if (exhibitionId) {
    where.exhibitionId = exhibitionId
  } else if (session.user.role !== 'SUPER_ADMIN') {
    // 非超級管理員只能看到自己創建的展覽的模板
    where.exhibition = {
      createdBy: session.user.id,
    }
  }

  // 查詢模板
  const templates = await prisma.siteTemplate.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // 獲取展覽列表用於篩選
  const exhibitions = await prisma.exhibition.findMany({
    where:
      session.user.role === 'SUPER_ADMIN'
        ? {}
        : { createdBy: session.user.id },
    select: {
      id: true,
      name: true,
      year: true,
    },
    orderBy: { year: 'desc' },
    take: 20,
  })

  return (
    <div className="p-8">
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">網站模板</h1>
          <p className="text-gray-600 mt-2">共 {templates.length} 個模板</p>
        </div>
        <Link
          href="/admin/templates/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增模板
        </Link>
      </div>

      {/* 篩選 */}
      {exhibitions.length > 1 && (
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
      )}

      {/* 模板網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* 預覽圖 */}
            {template.previewImageUrl ? (
              <div className="h-48 bg-gray-100">
                <img
                  src={template.previewImageUrl}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
            )}

            {/* 模板資訊 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex-1">
                  {template.name}
                </h3>
                {template.isPublished && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    已發布
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {template.exhibition.name} ({template.exhibition.year})
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>創建者：{template.creator?.name || '未知'}</span>
                <span>{new Date(template.updatedAt).toLocaleDateString('zh-TW')}</span>
              </div>

              {/* 操作按鈕 */}
              <div className="flex space-x-2">
                <Link
                  href={`/admin/templates/${template.id}/editor`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  編輯
                </Link>
                <Link
                  href={`/exhibitions/${template.exhibition.slug}`}
                  target="_blank"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  title="預覽前台"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p className="text-gray-500 mb-4">尚無模板</p>
          <Link
            href="/admin/templates/new"
            className="text-blue-600 hover:text-blue-900"
          >
            創建第一個模板
          </Link>
        </div>
      )}
    </div>
  )
}
