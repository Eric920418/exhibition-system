export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DeleteArtworkButton from '@/components/artworks/DeleteArtworkButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ArtworkDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢作品詳情
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          exhibition: {
            select: {
              id: true,
              name: true,
              year: true,
              createdBy: true,
            },
          },
          leader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      versions: {
        take: 5,
        orderBy: { changedAt: 'desc' },
        include: {
          changer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!artwork) {
    redirect('/admin/artworks')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    artwork.team.exhibition.createdBy === session.user.id ||
    artwork.team.leaderId === session.user.id ||
    artwork.createdBy === session.user.id

  // 刪除權限：僅 SUPER_ADMIN
  const canDelete = session.user.role === 'SUPER_ADMIN'

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">
              {artwork.title}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                artwork.isPublished
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {artwork.isPublished ? '已發布' : '未發布'}
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            {artwork.team.name} - {artwork.team.exhibition.name} (
            {artwork.team.exhibition.year})
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/artworks"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/artworks/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯作品
            </Link>
          )}
          {canDelete && (
            <DeleteArtworkButton
              artworkId={id}
              artworkTitle={artwork.title}
            />
          )}
        </div>
      </div>

      {/* 作品縮圖 */}
      {artwork.thumbnailUrl && (
        <div className="mb-6">
          <Image
            src={artwork.thumbnailUrl}
            alt={artwork.title}
            width={800}
            height={600}
            className="max-w-2xl w-full rounded-lg shadow"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">作品信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">作品名稱</h3>
            <p className="text-gray-800">{artwork.title}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">顯示順序</h3>
            <p className="text-gray-800">{artwork.displayOrder}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">創建者</h3>
            <p className="text-gray-800">
              {artwork.creator?.name || '未知'} ({artwork.creator?.email || '無'})
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">創建時間</h3>
            <p className="text-gray-800">
              {new Date(artwork.createdAt).toLocaleString('zh-TW')}
            </p>
          </div>
          {artwork.conceptShort && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                作品簡介（短）
              </h3>
              <p className="text-gray-800 whitespace-pre-wrap">
                {artwork.conceptShort}
              </p>
            </div>
          )}
          {artwork.concept && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                作品介紹（長）
              </h3>
              <p className="text-gray-800 whitespace-pre-wrap">
                {artwork.concept}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 媒體文件 */}
      {artwork.mediaUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            媒體文件 ({artwork.mediaUrls.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artwork.mediaUrls.map((url, index) => {
              const isVideo =
                url.endsWith('.mp4') ||
                url.endsWith('.webm') ||
                url.endsWith('.ogg')

              return (
                <div key={index} className="relative group">
                  {isVideo ? (
                    <video
                      src={url}
                      controls
                      className="w-full rounded-lg shadow"
                    >
                      您的瀏覽器不支援影片播放
                    </video>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={url}
                        alt={`媒體 ${index + 1}`}
                        width={400}
                        height={256}
                        className="w-full h-64 object-cover rounded-lg shadow group-hover:shadow-lg transition-shadow"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </a>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 團隊信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">所屬團隊</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">{artwork.team.name}</h3>
            <p className="text-sm text-gray-600">
              {artwork.team.exhibition.name} ({artwork.team.exhibition.year})
            </p>
            {artwork.team.leader && (
              <p className="text-sm text-gray-500 mt-1">
                組長：{artwork.team.leader.name}
              </p>
            )}
          </div>
          <Link
            href={`/admin/teams/${artwork.teamId}`}
            className="text-blue-600 hover:text-blue-900"
          >
            查看團隊
          </Link>
        </div>
      </div>

      {/* 版本歷史 */}
      {artwork.versions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">版本歷史</h2>
          <div className="space-y-3">
            {artwork.versions.map((version) => (
              <div
                key={version.id}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      版本 {version.version}
                    </p>
                    <p className="text-sm text-gray-600">
                      {version.changer?.name || '系統'} ·{' '}
                      {new Date(version.changedAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
