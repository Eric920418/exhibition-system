import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { completeReservationSchema } from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'
import { emitServingUpdate } from '@/lib/reservation-events'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * POST /api/reservations/serving/[teamId]/no-show
 * 標記預約未到場（需認證）
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    // 檢查權限
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        exhibition: {
          select: { createdBy: true },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的組別', 404)
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      team.exhibition.createdBy !== user.id &&
      team.leaderId !== user.id
    ) {
      return apiError('沒有權限執行此操作', 403)
    }

    const body = await request.json()
    const { reservationId } = completeReservationSchema.parse(body)

    // 檢查預約
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      return apiError('找不到該預約', 404)
    }

    if (reservation.teamId !== teamId) {
      return apiError('該預約不屬於此組別', 400)
    }

    if (!['WAITING', 'CALLED'].includes(reservation.status)) {
      return apiError(
        `無法標記未到：預約狀態為「${reservation.status}」`,
        400
      )
    }

    // 更新預約狀態
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'NO_SHOW',
      },
    })

    // 更新當前服務（如果是當前服務的預約）
    const currentServing = await prisma.currentServing.findUnique({
      where: { teamId },
    })

    if (currentServing?.servingReservationId === reservationId) {
      await prisma.currentServing.update({
        where: { teamId },
        data: { servingReservationId: null },
      })
    }

    // 獲取隊列統計
    const today = new Date(formatDateString(new Date()) + 'T00:00:00.000Z')
    const stats = await getQueueStats(teamId, today)

    // 發布 SSE 事件
    await emitServingUpdate(
      teamId,
      currentServing?.currentSequenceNumber || 0,
      undefined,
      undefined,
      stats.waiting
    )

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_NO_SHOW,
      userId: user.id,
      entityType: 'Reservation',
      entityId: reservationId,
      metadata: {
        teamId,
        sequenceNumber: reservation.sequenceNumber,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        reservation: {
          id: updated.id,
          sequenceNumber: updated.sequenceNumber,
          status: updated.status,
        },
      },
      '預約已標記為未到場'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
