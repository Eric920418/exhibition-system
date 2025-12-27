import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { getNextWaitingReservation, getQueueStats } from '@/lib/reservation-utils'
import { emitServingUpdate } from '@/lib/reservation-events'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * POST /api/reservations/serving/[teamId]/next
 * 叫下一位（需認證）
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    // 檢查組別和權限
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
        currentServing: {
          include: {
            reservation: true,
          },
        },
      },
    })

    if (!team) {
      return apiError('找不到指定的組別', 404)
    }

    // 權限檢查
    if (
      user.role !== 'SUPER_ADMIN' &&
      team.exhibition.createdBy !== user.id &&
      team.leaderId !== user.id
    ) {
      return apiError('沒有權限執行叫號操作', 403)
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

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

    // 獲取下一位等待中的預約
    const nextReservation = await getNextWaitingReservation(teamId, today)

    if (!nextReservation) {
      // 沒有等待中的預約
      await prisma.currentServing.upsert({
        where: { teamId },
        create: {
          teamId,
          currentSequenceNumber: team.currentServing?.currentSequenceNumber || 0,
          servingReservationId: null,
        },
        update: {
          servingReservationId: null,
        },
      })

      return apiSuccess(
        {
          hasNext: false,
          message: '目前沒有等候中的預約',
        },
        '目前沒有等候中的預約'
      )
    }

    // 使用事務更新預約狀態和當前服務
    const result = await prisma.$transaction(async (tx) => {
      // 更新預約狀態
      const updatedReservation = await tx.reservation.update({
        where: { id: nextReservation.id },
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
          currentSequenceNumber: nextReservation.sequenceNumber,
          servingReservationId: nextReservation.id,
        },
        update: {
          currentSequenceNumber: nextReservation.sequenceNumber,
          servingReservationId: nextReservation.id,
        },
      })

      return updatedReservation
    })

    // 獲取更新後的隊列統計
    const stats = await getQueueStats(teamId, today)

    // 發布 SSE 事件
    await emitServingUpdate(
      teamId,
      result.sequenceNumber,
      result.id,
      result.visitorName,
      stats.waiting
    )

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CALL_NEXT,
      userId: user.id,
      entityType: 'Reservation',
      entityId: result.id,
      metadata: {
        teamId,
        sequenceNumber: result.sequenceNumber,
        visitorName: result.visitorName,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        hasNext: true,
        reservation: {
          id: result.id,
          sequenceNumber: result.sequenceNumber,
          visitorName: result.visitorName,
          visitorPhone: maskPhone(result.visitorPhone),
          calledAt: result.calledAt,
        },
        queueWaiting: stats.waiting,
      },
      `已叫號：${result.sequenceNumber} 號`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}
