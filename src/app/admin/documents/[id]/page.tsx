export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentActions from '@/components/documents/DocumentActions'

interface PageProps {
  params: Promise<{ id: string }>
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

export default async function DocumentDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢文件詳情
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          createdBy: true,
        },
      },
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!document) {
    redirect('/admin/documents')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    document.exhibition.createdBy === session.user.id ||
    document.uploadedBy === session.user.id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">{document.title}</h1>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {documentTypeLabels[document.type]}
            </span>
          </div>
          <p className="text-gray-600 mt-2">v{document.version}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/documents"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            下載檔案
          </a>
          {canEdit && <DocumentActions documentId={id} />}
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">檔案大小</h3>
          <p className="text-2xl font-bold text-gray-800">
            {formatFileSize(document.fileSize ? Number(document.fileSize) : null)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">版本號</h3>
          <p className="text-2xl font-bold text-gray-800">v{document.version}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">上傳時間</h3>
          <p className="text-2xl font-bold text-gray-800">
            {new Date(document.uploadedAt).toLocaleDateString('zh-TW')}
          </p>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">文件信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">所屬展覽</h3>
            <Link
              href={`/admin/exhibitions/${document.exhibition.id}`}
              className="text-blue-600 hover:text-blue-900"
            >
              {document.exhibition.name} ({document.exhibition.year})
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">上傳者</h3>
            {document.uploader ? (
              <Link
                href={`/admin/users/${document.uploader.id}`}
                className="text-blue-600 hover:text-blue-900"
              >
                {document.uploader.name} ({document.uploader.email})
              </Link>
            ) : (
              <p className="text-gray-500">未知</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">文件類型</h3>
            <p className="text-gray-800">{documentTypeLabels[document.type]}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">MIME 類型</h3>
            <p className="text-gray-800">{document.mimeType || '-'}</p>
          </div>
        </div>
      </div>

      {/* 檔案預覽 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">檔案預覽</h2>
        {document.mimeType?.includes('pdf') ? (
          <iframe
            src={document.fileUrl}
            className="w-full h-[600px] border border-gray-300 rounded-lg"
            title={document.title}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 mb-4">此檔案類型不支援線上預覽</p>
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              下載檔案以查看
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
