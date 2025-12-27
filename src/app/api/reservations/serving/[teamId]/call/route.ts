import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { callReservationSchema } from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'
import { emitServingUpdate } from '@/lib/reservation-events'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * POST /api/reservations/serving/[teamId]/call
 * 指定叫號（跳號）- 需認證
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
        currentServing: {
          include: { reservation: true },
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
      return apiError('沒有權限執行叫號操作', 403)
    }

    const body = await request.json()
    const { reservationId } = callReservationSchema.parse(body)

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

    if (reservation.status !== 'WAITING') {
      return apiError(
        `無法叫號：預約狀態為「${reservation.status}」`,
        400
      )
    }

    const today = new Date(formatDateString(new Date()) + 'T00:00:00.000Z')

    // 如果當前有服務中的預約，先標記為完成
    if (team.currentServing?.reservation?.status === 'IN_PROGRESS') {
      await prisma.reservation.update({
        where: { id: team.currentServing.reservation.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    }

    // 使用事務更新預約狀態和當前服務
    const updated = await prisma.$transaction(async (tx) => {
      // 更新預約狀態
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CALLED',
          calledAt: new Date(),
        },
      })

      // 更新當前服務
      await tx.currentServing.upsert({
        where: { teamId },
        create: {
          teamId,
          currentSequenceNumber: reservation.sequenceNumber,
          servingReservationId: reservationId,
        },
        update: {
          currentSequenceNumber: reservation.sequenceNumber,
          servingReservationId: reservationId,
        },
      })

      return updatedReservation
    })

    // 獲取隊列統計
    const stats = await getQueueStats(teamId, today)

    // 發布 SSE 事件
    await emitServingUpdate(
      teamId,
      updated.sequenceNumber,
      updated.id,
      updated.visitorName,
      stats.waiting
    )

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CALL_SPECIFIC,
      userId: user.id,
      entityType: 'Reservation',
      entityId: reservationId,
      metadata: {
        teamId,
        sequenceNumber: reservation.sequenceNumber,
        visitorName: reservation.visitorName,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        reservation: {
          id: updated.id,
          sequenceNumber: updated.sequenceNumber,
          visitorName: updated.visitorName,
          visitorPhone: maskPhone(updated.visitorPhone),
          calledAt: updated.calledAt,
        },
        queueWaiting: stats.waiting,
      },
      `已叫號：${updated.sequenceNumber} 號`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}
