import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  exhibitionId?: string
  page?: string
}

export default async function ReservationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = 20
  const exhibitionId = params.exhibitionId

  // 構建查詢條件
  const where: any = {}
  if (user.role !== 'SUPER_ADMIN') {
    where.OR = [
      { createdBy: user.id },
      { members: { some: { userId: user.id } } },
    ]
  }
  if (exhibitionId) {
    where.id = exhibitionId
  }

  // 獲取展覽列表（用於篩選）
  const exhibitions = await prisma.exhibition.findMany({
    where,
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      year: true,
    },
  })

  // 獲取所有組別及其預約設定
  const teamWhere: any = {
    exhibition: where,
  }

  const skip = (page - 1) * limit

  const [total, teams] = await Promise.all([
    prisma.team.count({ where: teamWhere }),
    prisma.team.findMany({
      where: teamWhere,
      skip,
      take: limit,
      orderBy: [
        { exhibition: { year: 'desc' } },
        { displayOrder: 'asc' },
      ],
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        reservationConfig: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">預約設定管理</h1>
          <p className="text-gray-500 mt-1">為各組別設定預約參數</p>
        </div>
        <Link
          href="/admin/reservations"
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回總覽
        </Link>
      </div>

      {/* 篩選區 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">展覽篩選：</label>
          <select
            name="exhibitionId"
            defaultValue={exhibitionId || ''}
            className="border rounded-lg px-3 py-2 text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) {
                url.searchParams.set('exhibitionId', e.target.value)
              } else {
                url.searchParams.delete('exhibitionId')
              }
              url.searchParams.delete('page')
              window.location.href = url.toString()
            }}
          >
            <option value="">全部展覽</option>
            {exhibitions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.year})
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* 組別列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                組別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                展覽
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                預約設定
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                預約數
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="text-sm text-gray-500">{team.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {team.exhibition.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {team.exhibition.year}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {team.reservationConfig ? (
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {team.reservationConfig.slotDurationMinutes} 分鐘/時段
                      </div>
                      <div className="text-gray-500">
                        {formatTime(team.reservationConfig.dailyStartTime)} -{' '}
                        {formatTime(team.reservationConfig.dailyEndTime)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">未設定</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {team.reservationConfig ? (
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        team.reservationConfig.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {team.reservationConfig.isActive ? '啟用中' : '已停用'}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {team._count.reservations} 筆
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  {team.reservationConfig ? (
                    <>
                      <Link
                        href={`/admin/reservations/${team.id}/config`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        編輯
                      </Link>
                      <Link
                        href={`/admin/reservations/${team.id}/queue`}
                        className="text-green-600 hover:text-green-800"
                      >
                        叫號
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/admin/reservations/${team.id}/config?mode=create`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      創建設定
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {teams.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            沒有找到任何組別
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-500">
              共 {total} 個組別，第 {page} / {totalPages} 頁
            </span>
            <div className="space-x-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}${
                    exhibitionId ? `&exhibitionId=${exhibitionId}` : ''
                  }`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                >
                  上一頁
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}${
                    exhibitionId ? `&exhibitionId=${exhibitionId}` : ''
                  }`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                >
                  下一頁
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
