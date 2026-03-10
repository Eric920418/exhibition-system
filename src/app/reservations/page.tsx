import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// 強制動態渲染，確保每次都讀取最新資料
export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
  // 獲取有啟用預約設定的組別
  const teams = await prisma.team.findMany({
    where: {
      reservationConfig: {
        isActive: true,
      },
      exhibition: {
        status: 'PUBLISHED',
      },
    },
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
          slug: true,
        },
      },
      reservationConfig: {
        select: {
          slotDurationMinutes: true,
          dailyStartTime: true,
          dailyEndTime: true,
        },
      },
      _count: {
        select: {
          reservations: {
            where: {
              reservationDate: new Date(new Date().toISOString().split('T')[0]),
              status: 'WAITING',
            },
          },
        },
      },
    },
  })

  // 按展覽分組
  const teamsByExhibition = teams.reduce((acc, team) => {
    const key = team.exhibition.id
    if (!acc[key]) {
      acc[key] = {
        exhibition: team.exhibition,
        teams: [],
      }
    }
    acc[key].teams.push(team)
    return acc
  }, {} as Record<string, { exhibition: typeof teams[0]['exhibition']; teams: typeof teams }>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">預約服務</h1>
          <p className="text-gray-600 mt-1">選擇您想要預約的組別</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {Object.keys(teamsByExhibition).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              目前沒有開放預約的組別
            </h2>
            <p className="text-gray-600">請稍後再試或聯繫工作人員</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(teamsByExhibition).map(({ exhibition, teams }) => (
              <div key={exhibition.id}>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  {exhibition.name}{' '}
                  <span className="text-gray-400">({exhibition.year})</span>
                </h2>

                <div className="grid gap-4">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/reservations/${team.id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2 sm:line-clamp-1">
                              {team.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                            <span>
                              {formatTime(team.reservationConfig!.dailyStartTime)}{' '}
                              - {formatTime(team.reservationConfig!.dailyEndTime)}
                            </span>
                            <span>
                              每時段 {team.reservationConfig!.slotDurationMinutes}{' '}
                              分鐘
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:flex-col sm:text-right gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div className="flex items-center sm:block gap-2">
                            <div className="text-2xl font-bold text-blue-600">
                              {team._count.reservations}
                            </div>
                            <div className="text-sm text-gray-500">人等候中</div>
                          </div>
                          <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium group-hover:bg-blue-700 transition-colors whitespace-nowrap">
                            立即取號
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 查詢預約連結 */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">已經有預約了？</p>
          <Link
            href="/reservations/status"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            查詢我的預約
          </Link>
        </div>
      </main>
    </div>
  )
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
