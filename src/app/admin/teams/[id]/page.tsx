import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢團隊詳情
  const team = await prisma.team.findUnique({
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
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        orderBy: { displayOrder: 'asc' },
      },
      artworks: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          isPublished: true,
          displayOrder: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
      _count: {
        select: {
          members: true,
          artworks: true,
        },
      },
    },
  })

  if (!team) {
    redirect('/admin/teams')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    team.exhibition.createdBy === session.user.id ||
    team.leaderId === session.user.id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">{team.name}</h1>
          </div>
          <p className="text-gray-600 mt-2">
            {team.exhibition.name} ({team.exhibition.year}) · {team.slug}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/teams"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/teams/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯團隊
            </Link>
          )}
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">團隊成員</h3>
          <p className="text-2xl font-bold text-gray-800">
            {team._count.members}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">團隊作品</h3>
          <p className="text-2xl font-bold text-gray-800">
            {team._count.artworks}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">顯示順序</h3>
          <p className="text-2xl font-bold text-gray-800">{team.displayOrder}</p>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">團隊信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">所屬展覽</h3>
            <Link
              href={`/admin/exhibitions/${team.exhibition.id}`}
              className="text-blue-600 hover:text-blue-900"
            >
              {team.exhibition.name} ({team.exhibition.year})
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">組長</h3>
            {team.leader ? (
              <Link
                href={`/admin/users/${team.leader.id}`}
                className="text-blue-600 hover:text-blue-900"
              >
                {team.leader.name} ({team.leader.email})
              </Link>
            ) : (
              <p className="text-gray-500">未指定</p>
            )}
          </div>
          {team.description && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">描述</h3>
              <p className="text-gray-800 whitespace-pre-wrap">
                {team.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 團隊成員 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">團隊成員</h2>
          {canEdit && (
            <Link
              href={`/admin/teams/${id}/members/new`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              添加成員
            </Link>
          )}
        </div>
        {team.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    順序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    角色
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {team.members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.role || '-'}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/team-members/${member.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編輯
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">尚無成員</p>
        )}
      </div>

      {/* 團隊作品 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">團隊作品</h2>
          {canEdit && (
            <Link
              href={`/admin/artworks/new?teamId=${id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              添加作品
            </Link>
          )}
        </div>
        {team.artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.artworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/admin/artworks/${artwork.id}`}
                className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {artwork.thumbnailUrl ? (
                    <img
                      src={artwork.thumbnailUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12"
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
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 truncate">
                    {artwork.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    創建者：{artwork.creator?.name || '未知'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">尚無作品</p>
        )}
      </div>
    </div>
  )
}
