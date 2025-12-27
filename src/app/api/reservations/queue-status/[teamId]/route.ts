import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import {
  getQueueStats,
  getCurrentServingStatus,
  formatDateString,
  calculateEstimatedWaitTime,
} from '@/lib/reservation-utils'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * GET /api/reservations/queue-status/[teamId]
 * 獲取組別當前隊列狀態（公開 API）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || formatDateString(new Date())

    // 檢查組別是否存在且預約功能已啟用
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        reservationConfig: true,
        exhibition: {
          select: {
            name: true,
            year: true,
            status: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的組別', 404)
    }

    if (!team.reservationConfig) {
      return apiError('此組別未開放預約', 400)
    }

    if (!team.reservationConfig.isActive) {
      return apiError('此組別的預約功能已暫停', 400)
    }

    const dateObj = new Date(date + 'T00:00:00.000Z')

    // 獲取隊列統計
    const stats = await getQueueStats(teamId, dateObj)

    // 獲取當前服務狀態
    const serving = await getCurrentServingStatus(teamId)

    // 計算下一位的預估等候時間
    const estimatedWaitForNext = await calculateEstimatedWaitTime(
      teamId,
      stats.waiting + 1
    )

    // 檢查是否在營業時間內
    const now = new Date()
    const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes()
    const startTime =
      team.reservationConfig.dailyStartTime.getUTCHours() * 60 +
      team.reservationConfig.dailyStartTime.getUTCMinutes()
    const endTime =
      team.reservationConfig.dailyEndTime.getUTCHours() * 60 +
      team.reservationConfig.dailyEndTime.getUTCMinutes()

    const isOpen = currentTime >= startTime && currentTime < endTime

    return apiSuccess({
      team: {
        id: team.id,
        name: team.name,
        exhibition: team.exhibition,
      },
      date,
      isOpen,
      operatingHours: {
        start: formatTime(team.reservationConfig.dailyStartTime),
        end: formatTime(team.reservationConfig.dailyEndTime),
      },
      currentServing: serving
        ? {
            sequenceNumber: serving.currentSequenceNumber,
            reservation: serving.reservation
              ? {
                  id: serving.reservation.id,
                  visitorName: maskName(serving.reservation.visitorName),
                  calledAt: serving.reservation.calledAt,
                }
              : null,
          }
        : null,
      queue: {
        waiting: stats.waiting,
        called: stats.called,
        inProgress: stats.inProgress,
        completed: stats.completed,
        total: stats.total,
      },
      estimatedWaitForNext: estimatedWaitForNext,
      config: {
        slotDurationMinutes: team.reservationConfig.slotDurationMinutes,
        maxConcurrentCapacity: team.reservationConfig.maxConcurrentCapacity,
      },
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

/**
 * 遮蔽姓名（保留第一個字）
 */
function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}
