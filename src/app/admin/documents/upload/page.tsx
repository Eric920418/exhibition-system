import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentUploadForm from '@/components/forms/DocumentUploadForm'

interface SearchParams {
  exhibitionId?: string
}

export default async function UploadDocumentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 檢查權限：只有超級管理員和策展人可以上傳
  if (!['SUPER_ADMIN', 'CURATOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  const params = await searchParams
  const exhibitionId = params.exhibitionId

  // 如果沒有提供 exhibitionId，顯示展覽選擇頁面
  if (!exhibitionId) {
    // 獲取可用的展覽
    const exhibitions = await prisma.exhibition.findMany({
      where:
        session.user.role === 'SUPER_ADMIN'
          ? {} // 超級管理員可以看到所有展覽
          : { createdBy: session.user.id }, // 策展人只能看到自己創建的展覽
      select: {
        id: true,
        name: true,
        year: true,
        status: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    })

    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">上傳文件</h1>
          <p className="text-gray-600 mt-2">請選擇要上傳文件的展覽</p>
        </div>

        {exhibitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">您目前沒有可以上傳文件的展覽</p>
            <a
              href="/admin/exhibitions/new"
              className="text-blue-600 hover:text-blue-900"
            >
              創建新展覽
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibitions.map((exhibition) => (
              <a
                key={exhibition.id}
                href={`/admin/documents/upload?exhibitionId=${exhibition.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {exhibition.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{exhibition.year} 年</p>
                <div className="flex items-center justify-between">
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
                  <span className="text-sm text-gray-500">
                    {exhibition._count.documents} 個文件
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 驗證展覽存在並檢查權限
  const exhibition = await prisma.exhibition.findUnique({
    where: { id: exhibitionId },
    select: {
      id: true,
      name: true,
      year: true,
      createdBy: true,
    },
  })

  if (!exhibition) {
    redirect('/admin/documents/upload')
  }

  // 檢查權限
  if (
    session.user.role !== 'SUPER_ADMIN' &&
    exhibition.createdBy !== session.user.id
  ) {
    redirect('/admin/documents/upload')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">上傳文件</h1>
        <p className="text-gray-600 mt-2">
          展覽：{exhibition.name} ({exhibition.year})
        </p>
      </div>

      <DocumentUploadForm exhibitionId={exhibitionId} />
    </div>
  )
}
