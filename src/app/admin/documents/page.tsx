import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  page?: string
  exhibitionId?: string
  type?: string
}

const documentTypeLabels: Record<string, string> = {
  PROPOSAL: '企劃書',
  DESIGN: '設計稿',
  PLAN: '計劃書',
  OTHER: '其他',
}

// 格式化檔案大小
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default async function DocumentsPage({
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
  const type = params.type || undefined
  const limit = 20

  // 構建查詢條件
  const where: any = {}
  if (exhibitionId) {
    where.exhibitionId = exhibitionId
  }
  if (type && ['PROPOSAL', 'DESIGN', 'PLAN', 'OTHER'].includes(type)) {
    where.type = type
  }

  // 查詢數據
  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        uploader: {
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
    <div className="p-8">
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">文件管理</h1>
          <p className="text-gray-600 mt-2">共 {total} 個文件</p>
        </div>
        <Link
          href="/admin/documents/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          上傳文件
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
          <select
            name="type"
            defaultValue={type || ''}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有類型</option>
            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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

      {/* 文件列表 */}
      {documents.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  標題
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  所屬展覽
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  大小
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  上傳者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  上傳時間
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.title}
                    </div>
                    {doc.mimeType && (
                      <div className="text-xs text-gray-500">{doc.mimeType}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {documentTypeLabels[doc.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/admin/exhibitions/${doc.exhibition.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {doc.exhibition.name} ({doc.exhibition.year})
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(doc.fileSize ? Number(doc.fileSize) : null)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    v{doc.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.uploader?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/documents/${doc.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      查看
                    </Link>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-900"
                    >
                      下載
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">沒有找到符合條件的文件</p>
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
                  href={`/admin/documents?page=${pageNum}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}${type ? `&type=${type}` : ''}`}
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
