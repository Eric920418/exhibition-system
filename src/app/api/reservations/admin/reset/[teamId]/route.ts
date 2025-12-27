import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis, RedisKeys } from '@/lib/redis'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import { formatDateString } from '@/lib/reservation-utils'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * POST /api/reservations/admin/reset/[teamId]
 * 手動重置組別當日序號（需認證 - 僅管理員）
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    // 只有 SUPER_ADMIN 或展覽創建者可以重置
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
      team.exhibition.createdBy !== user.id
    ) {
      return apiError('沒有權限執行重置操作', 403)
    }

    const today = formatDateString(new Date())

    // 1. 重置 Redis 序號計數器
    const sequenceKey = RedisKeys.reservationSequence(teamId, today)
    await redis.del(sequenceKey)

    // 2. 重置 CurrentServing 記錄
    await prisma.currentServing.upsert({
      where: { teamId },
      create: {
        teamId,
        currentSequenceNumber: 0,
        servingReservationId: null,
      },
      update: {
        currentSequenceNumber: 0,
        servingReservationId: null,
      },
    })

    // 3. 統計當日預約數量
    const todayDate = new Date(today + 'T00:00:00.000Z')
    const stats = await prisma.reservation.groupBy({
      by: ['status'],
      where: {
        teamId,
        reservationDate: todayDate,
      },
      _count: true,
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_DAILY_RESET,
      userId: user.id,
      entityType: 'Team',
      entityId: teamId,
      metadata: {
        date: today,
        stats: stats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {}
        ),
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        teamId,
        date: today,
        resetAt: new Date().toISOString(),
      },
      '已成功重置當日序號'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
