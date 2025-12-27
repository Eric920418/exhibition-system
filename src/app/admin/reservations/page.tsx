import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ReservationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  // 構建查詢條件
  const where: any = {}
  if (user.role !== 'SUPER_ADMIN') {
    where.exhibition = {
      OR: [
        { createdBy: user.id },
        { members: { some: { userId: user.id } } },
      ],
    }
  }

  // 獲取統計數據
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalConfigs,
    activeConfigs,
    todayReservations,
    waitingCount,
    completedToday,
  ] = await Promise.all([
    // 總設定數
    prisma.reservationConfig.count({
      where: { team: where },
    }),
    // 啟用中的設定
    prisma.reservationConfig.count({
      where: {
        isActive: true,
        team: where,
      },
    }),
    // 今日預約總數
    prisma.reservation.count({
      where: {
        reservationDate: today,
        team: where,
      },
    }),
    // 等候中人數
    prisma.reservation.count({
      where: {
        reservationDate: today,
        status: 'WAITING',
        team: where,
      },
    }),
    // 今日完成數
    prisma.reservation.count({
      where: {
        reservationDate: today,
        status: 'COMPLETED',
        team: where,
      },
    }),
  ])

  // 獲取有預約設定的組別列表（最近活動）
  const recentTeams = await prisma.team.findMany({
    where: {
      ...where,
      reservationConfig: {
        isNot: null,
      },
    },
    take: 5,
    orderBy: {
      reservationConfig: {
        updatedAt: 'desc',
      },
    },
    include: {
      exhibition: {
        select: {
          name: true,
          year: true,
        },
      },
      reservationConfig: {
        select: {
          isActive: true,
          dailyStartTime: true,
          dailyEndTime: true,
        },
      },
      _count: {
        select: {
          reservations: {
            where: {
              reservationDate: today,
            },
          },
        },
      },
    },
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">預約叫號系統</h1>
          <p className="text-gray-500 mt-1">管理展覽組別的預約設定和叫號服務</p>
        </div>
        <Link
          href="/admin/reservations/settings"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          管理預約設定
        </Link>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">預約設定</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalConfigs}</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeConfigs} 個啟用中
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">今日預約</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{todayReservations}</p>
          <p className="text-sm text-gray-500 mt-1">
            總預約人數
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">等候中</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{waitingCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            尚未叫號
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">已完成</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedToday}</p>
          <p className="text-sm text-gray-500 mt-1">
            今日服務完成
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">完成率</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {todayReservations > 0
              ? Math.round((completedToday / todayReservations) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-gray-500 mt-1">
            今日進度
          </p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 近期設定的組別 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">已設定預約的組別</h2>
          </div>
          <div className="divide-y">
            {recentTeams.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>尚未設定任何預約</p>
                <Link
                  href="/admin/reservations/settings"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  前往設定
                </Link>
              </div>
            ) : (
              recentTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-500">
                      {team.exhibition.name} ({team.exhibition.year})
                    </p>
                    {team.reservationConfig && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(team.reservationConfig.dailyStartTime)} -{' '}
                        {formatTime(team.reservationConfig.dailyEndTime)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        team.reservationConfig?.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {team.reservationConfig?.isActive ? '啟用中' : '已停用'}
                    </span>
                    <span className="text-sm text-gray-500">
                      今日 {team._count.reservations} 人
                    </span>
                    <Link
                      href={`/admin/reservations/${team.id}/queue`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      叫號
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 快速入口 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">快速入口</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              href="/admin/reservations/settings"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-medium">預約設定</h3>
              <p className="text-sm text-gray-500">管理組別預約參數</p>
            </Link>

            <Link
              href="/reservations/display/multi"
              target="_blank"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">📺</div>
              <h3 className="font-medium">大螢幕顯示</h3>
              <p className="text-sm text-gray-500">開啟叫號顯示螢幕</p>
            </Link>

            <Link
              href="/reservations"
              target="_blank"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">🎫</div>
              <h3 className="font-medium">觀眾預約入口</h3>
              <p className="text-sm text-gray-500">查看前台預約頁面</p>
            </Link>

            <Link
              href="/reservations/status"
              target="_blank"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-medium">狀態查詢</h3>
              <p className="text-sm text-gray-500">查詢預約等候狀態</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
