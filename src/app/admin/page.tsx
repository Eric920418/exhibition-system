export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 根據角色構建查詢條件
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const exhibitionWhere = isSuperAdmin ? {} : { createdBy: session.user.id }

  // 獲取統計數據
  const [
    userCount,
    exhibitionCount,
    teamCount,
    artworkCount,
    sponsorCount,
    venueCount,
    documentCount,
    exhibitionsByStatus,
    recentExhibitions,
    recentArtworks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.exhibition.count({ where: exhibitionWhere }),
    prisma.team.count({
      where: isSuperAdmin
        ? {}
        : {
            exhibition: { createdBy: session.user.id },
          },
    }),
    prisma.artwork.count({
      where: isSuperAdmin
        ? {}
        : {
            team: {
              exhibition: { createdBy: session.user.id },
            },
          },
    }),
    prisma.sponsor.count({
      where: isSuperAdmin
        ? {}
        : {
            exhibition: { createdBy: session.user.id },
          },
    }),
    prisma.venue.count({
      where: isSuperAdmin
        ? {}
        : {
            exhibition: { createdBy: session.user.id },
          },
    }),
    prisma.document.count({
      where: isSuperAdmin
        ? {}
        : {
            exhibition: { createdBy: session.user.id },
          },
    }),
    // 展覽狀態分布
    Promise.all([
      prisma.exhibition.count({
        where: { ...exhibitionWhere, status: 'PUBLISHED' },
      }),
      prisma.exhibition.count({
        where: { ...exhibitionWhere, status: 'DRAFT' },
      }),
      prisma.exhibition.count({
        where: { ...exhibitionWhere, status: 'ARCHIVED' },
      }),
    ]),
    // 最近的展覽
    prisma.exhibition.findMany({
      where: exhibitionWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        year: true,
        status: true,
        createdAt: true,
      },
    }),
    // 最近的作品
    prisma.artwork.findMany({
      where: isSuperAdmin
        ? {}
        : {
            team: {
              exhibition: { createdBy: session.user.id },
            },
          },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        isPublished: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ])

  const [publishedCount, draftCount, archivedCount] = exhibitionsByStatus

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">管理後台</h1>
        <p className="text-gray-600 mt-2">
          歡迎回來，{session.user.name}
          {!isSuperAdmin && <span className="ml-2 text-sm">(策展人視圖)</span>}
        </p>
      </div>

      {/* 主要統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm">展覽數量</p>
              <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{exhibitionCount}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-lg hidden sm:block">
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm">團隊數量</p>
              <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{teamCount}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-lg hidden sm:block">
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm">作品總數</p>
              <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{artworkCount}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-lg hidden sm:block">
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
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
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs md:text-sm">總用戶數</p>
              <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">{userCount}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-lg hidden sm:block">
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 次要統計卡片 */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">贊助商</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                {sponsorCount}
              </p>
            </div>
            <div className="bg-pink-100 p-2 rounded-lg hidden md:block">
              <svg
                className="w-6 h-6 text-pink-600"
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">展覽場地</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{venueCount}</p>
            </div>
            <div className="bg-teal-100 p-2 rounded-lg hidden md:block">
              <svg
                className="w-6 h-6 text-teal-600"
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">文件數量</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                {documentCount}
              </p>
            </div>
            <div className="bg-indigo-100 p-2 rounded-lg hidden md:block">
              <svg
                className="w-6 h-6 text-indigo-600"
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
            </div>
          </div>
        </div>
      </div>

      {/* 展覽狀態分布 */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">展覽狀態分布</h2>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-green-600">{publishedCount}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">已發布</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-yellow-600">{draftCount}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">草稿</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-gray-600">{archivedCount}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">已歸檔</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
        {/* 最近的展覽 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">最近的展覽</h2>
            <Link href="/admin/exhibitions" className="text-blue-600 hover:text-blue-900 text-sm">
              查看全部 →
            </Link>
          </div>
          {recentExhibitions.length > 0 ? (
            <div className="space-y-3">
              {recentExhibitions.map((exhibition) => (
                <Link
                  key={exhibition.id}
                  href={`/admin/exhibitions/${exhibition.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{exhibition.name}</p>
                    <p className="text-sm text-gray-500">{exhibition.year} 年</p>
                  </div>
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
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">尚無展覽</p>
          )}
        </div>

        {/* 最近的作品 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">最近的作品</h2>
            <Link href="/admin/artworks" className="text-blue-600 hover:text-blue-900 text-sm">
              查看全部 →
            </Link>
          </div>
          {recentArtworks.length > 0 ? (
            <div className="space-y-3">
              {recentArtworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/admin/artworks/${artwork.id}`}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {artwork.thumbnailUrl ? (
                    <img
                      src={artwork.thumbnailUrl}
                      alt={artwork.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
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
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{artwork.title}</p>
                    <p className="text-sm text-gray-500">{artwork.team.name}</p>
                  </div>
                  {artwork.isPublished ? (
                    <span className="text-xs text-green-600">已發布</span>
                  ) : (
                    <span className="text-xs text-gray-500">未發布</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">尚無作品</p>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">快速操作</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
          <Link
            href="/admin/exhibitions/new"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-blue-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">新增展覽</span>
          </Link>

          <Link
            href="/admin/teams/new"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-green-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">新增團隊</span>
          </Link>

          <Link
            href="/admin/artworks/new"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-purple-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
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
            <span className="text-xs md:text-sm font-medium text-gray-700">上傳作品</span>
          </Link>

          <Link
            href="/admin/sponsors/new"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-pink-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
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
            <span className="text-xs md:text-sm font-medium text-gray-700">新增贊助商</span>
          </Link>

          <Link
            href="/admin/venues/new"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-teal-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
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
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">新增場地</span>
          </Link>

          <Link
            href="/admin/documents/upload"
            className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="bg-indigo-500 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">上傳文件</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
