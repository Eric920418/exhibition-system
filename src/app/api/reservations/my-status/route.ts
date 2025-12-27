import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { myReservationStatusSchema } from '@/lib/validations/reservation'
import {
  getQueuePosition,
  calculateEstimatedWaitTime,
  getCurrentServingStatus,
  formatDateString,
} from '@/lib/reservation-utils'

/**
 * GET /api/reservations/my-status
 * 查詢個人預約狀態（公開 API，需手機號碼驗證）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { phone, date } = myReservationStatusSchema.parse(searchParams)

    // 默認查詢今天
    const queryDate = date || formatDateString(new Date())
    const dateObj = new Date(queryDate + 'T00:00:00.000Z')

    // 查詢該手機號碼的預約
    const reservations = await prisma.reservation.findMany({
      where: {
        visitorPhone: phone,
        reservationDate: dateObj,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            exhibition: {
              select: {
                id: true,
                name: true,
                year: true,
              },
            },
          },
        },
      },
    })

    if (reservations.length === 0) {
      return apiError('找不到該手機號碼的預約記錄', 404)
    }

    // 為每個預約附加額外資訊
    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        let queuePosition = null
        let estimatedWaitMinutes = null
        let currentServing = null

        // 只有等待中的預約才需要計算隊列資訊
        if (reservation.status === 'WAITING') {
          queuePosition = await getQueuePosition(
            reservation.teamId,
            dateObj,
            reservation.sequenceNumber
          )
          estimatedWaitMinutes = await calculateEstimatedWaitTime(
            reservation.teamId,
            queuePosition
          )
        }

        // 獲取當前服務狀態
        const serving = await getCurrentServingStatus(reservation.teamId)
        if (serving) {
          currentServing = {
            sequenceNumber: serving.currentSequenceNumber,
          }
        }

        return {
          id: reservation.id,
          sequenceNumber: reservation.sequenceNumber,
          visitorName: reservation.visitorName,
          status: reservation.status,
          statusText: getStatusText(reservation.status),
          queuePosition,
          estimatedWaitMinutes,
          currentServing,
          checkInTime: reservation.checkInTime,
          calledAt: reservation.calledAt,
          completedAt: reservation.completedAt,
          createdAt: reservation.createdAt,
          team: reservation.team,
          canCancel: reservation.status === 'WAITING',
        }
      })
    )

    return apiSuccess({
      reservations: reservationsWithDetails,
      date: queryDate,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 獲取狀態的中文描述
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    WAITING: '等待中',
    CALLED: '已叫號',
    IN_PROGRESS: '服務中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    NO_SHOW: '未到場',
  }
  return statusMap[status] || status
}
