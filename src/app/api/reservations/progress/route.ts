import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import {
  getCurrentSequenceNumber,
  getQueueStats,
  formatDateString,
} from '@/lib/reservation-utils'
import { getOrSet } from '@/lib/cache'

/**
 * GET /api/reservations/progress
 * 獲取所有組別的預約進度（公開 API）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || formatDateString(new Date())
    const dateObj = new Date(date + 'T00:00:00.000Z')

    // 查詢所有有啟用預約設定的組別
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
      select: {
        id: true,
        name: true,
        reservationConfig: {
          select: {
            dailyStartTime: true,
            dailyEndTime: true,
          },
        },
        artworks: {
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          take: 1,
          select: { title: true },
        },
      },
    })

    const cacheKey = `api:progress:${date}`

    const result = await getOrSet(cacheKey, async () => {
      const teamsProgress = await Promise.all(
        teams.map(async (team) => {
          const [latestSequenceNumber, serving, stats] = await Promise.all([
            getCurrentSequenceNumber(team.id, date),
            prisma.currentServing.findUnique({
              where: { teamId: team.id },
              select: { currentSequenceNumber: true },
            }),
            getQueueStats(team.id, dateObj),
          ])

          const now = new Date()
          const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes()
          const config = team.reservationConfig!
          const startTime =
            config.dailyStartTime.getUTCHours() * 60 +
            config.dailyStartTime.getUTCMinutes()
          const endTime =
            config.dailyEndTime.getUTCHours() * 60 +
            config.dailyEndTime.getUTCMinutes()
          const isOpen = currentTime >= startTime && currentTime < endTime

          return {
            teamId: team.id,
            teamName: team.name,
            artworkTitle: team.artworks[0]?.title ?? null,
            latestSequenceNumber,
            currentServingNumber: serving?.currentSequenceNumber ?? 0,
            waitingCount: stats.waiting,
            isOpen,
          }
        })
      )

      return {
        teams: teamsProgress,
        date,
        timestamp: new Date().toISOString(),
      }
    }, 30) // 30 秒 TTL

    return apiSuccess(result, undefined, 200, {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
