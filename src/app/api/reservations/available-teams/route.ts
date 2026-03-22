import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'

/**
 * GET /api/reservations/available-teams
 * 獲取可預約的組別列表（公開 API）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const exhibitionId = searchParams.get('exhibitionId')
    const venueType = searchParams.get('venueType')  // 'OUTDOOR' | 'INDOOR'
    const date = searchParams.get('date') || formatDateString(new Date())

    // 構建查詢條件
    const where: any = {
      reservationConfig: {
        isActive: true,
      },
      exhibition: {
        status: 'PUBLISHED',
        ...(venueType ? { venueType } : {}),
      },
    }

    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    // 獲取有啟用預約設定的組別
    const teams = await prisma.team.findMany({
      where,
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
            venueType: true,
          },
        },
        reservationConfig: {
          select: {
            slotDurationMinutes: true,
            maxConcurrentCapacity: true,
            dailyStartTime: true,
            dailyEndTime: true,
          },
        },
      },
    })

    // 為每個組別附加當前隊列狀態
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const dateObj = new Date(date + 'T00:00:00.000Z')
        const stats = await getQueueStats(team.id, dateObj)

        // 計算預估等候時間
        const config = team.reservationConfig!
        const serviceTime = config.slotDurationMinutes
        const capacity = config.maxConcurrentCapacity
        const estimatedWait = Math.ceil(
          (stats.waiting / capacity) * serviceTime
        )

        return {
          id: team.id,
          name: team.name,
          slug: team.slug,
          teamType: team.teamType,
          description: team.description,
          venueType: team.exhibition.venueType,
          exhibition: team.exhibition,
          config: {
            slotDurationMinutes: config.slotDurationMinutes,
            maxConcurrentCapacity: config.maxConcurrentCapacity,
            dailyStartTime: formatTime(config.dailyStartTime),
            dailyEndTime: formatTime(config.dailyEndTime),
          },
          queueStats: {
            waiting: stats.waiting,
            estimatedWaitMinutes: estimatedWait,
          },
        }
      })
    )

    return apiSuccess({
      teams: teamsWithStats,
      date,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
