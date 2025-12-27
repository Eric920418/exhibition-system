import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExhibitionDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢展覽詳情
  const exhibition = await prisma.exhibition.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      teams: {
        include: {
          leader: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              artworks: true,
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
      sponsors: {
        orderBy: { displayOrder: 'asc' },
      },
      venues: true,
      _count: {
        select: {
          documents: true,
          boards: true,
        },
      },
    },
  })

  if (!exhibition) {
    redirect('/admin/exhibitions')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    exhibition.createdBy === session.user.id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">
              {exhibition.name}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
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
          </div>
          <p className="text-gray-600 mt-2">{exhibition.slug}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/exhibitions"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/exhibitions/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯展覽
            </Link>
          )}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">展覽年份</h3>
          <p className="text-2xl font-bold text-gray-800">{exhibition.year}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">團隊數量</h3>
          <p className="text-2xl font-bold text-gray-800">
            {exhibition.teams.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">成員數量</h3>
          <p className="text-2xl font-bold text-gray-800">
            {exhibition.members.length}
          </p>
        </div>
      </div>

      {/* 詳細信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">展覽信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">展覽期間</h3>
            <p className="text-gray-800">
              {new Date(exhibition.startDate).toLocaleDateString('zh-TW')} -{' '}
              {new Date(exhibition.endDate).toLocaleDateString('zh-TW')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">創建者</h3>
            <p className="text-gray-800">
              {exhibition.creator?.name || '未知'} (
              {exhibition.creator?.email || '無'})
            </p>
          </div>
          {exhibition.description && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">描述</h3>
              <p className="text-gray-800 whitespace-pre-wrap">
                {exhibition.description}
              </p>
            </div>
          )}
          {exhibition.posterUrl && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">海報</h3>
              <img
                src={exhibition.posterUrl}
                alt={exhibition.name}
                className="max-w-md rounded-lg shadow"
              />
            </div>
          )}
        </div>
      </div>

      {/* 團隊列表 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">團隊列表</h2>
          {canEdit && (
            <Link
              href={`/admin/teams/new?exhibitionId=${id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              新增團隊
            </Link>
          )}
        </div>
        {exhibition.teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    團隊名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    組長
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    成員數
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    作品數
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exhibition.teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {team.name}
                      </div>
                      <div className="text-sm text-gray-500">{team.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.leader?.name || '未指定'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team._count.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team._count.artworks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/teams/${team.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">尚無團隊</p>
        )}
      </div>

      {/* 贊助商列表 */}
      {exhibition.sponsors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">贊助商</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exhibition.sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  {sponsor.logoUrl && (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {sponsor.name}
                    </h3>
                    {sponsor.tier && (
                      <p className="text-sm text-gray-500">{sponsor.tier}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 場地信息 */}
      {exhibition.venues.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">展覽場地</h2>
          <div className="space-y-4">
            {exhibition.venues.map((venue) => (
              <div
                key={venue.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-medium text-gray-800 mb-2">
                  {venue.name}
                </h3>
                {venue.address && (
                  <p className="text-sm text-gray-600 mb-1">
                    地址：{venue.address}
                  </p>
                )}
                {venue.capacity && (
                  <p className="text-sm text-gray-600">
                    容納人數：{venue.capacity}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
