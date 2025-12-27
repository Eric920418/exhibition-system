import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * GET /api/reservations/serving/[teamId]
 * 獲取當前服務狀態和隊列資訊（需認證）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || formatDateString(new Date())
    const dateObj = new Date(date + 'T00:00:00.000Z')

    // 檢查組別和權限
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        reservationConfig: true,
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
      return apiError('沒有權限查看此組別的叫號狀態', 403)
    }

    if (!team.reservationConfig) {
      return apiError('此組別未設定預約功能', 400)
    }

    // 獲取隊列統計
    const stats = await getQueueStats(teamId, dateObj)

    // 獲取等候中的預約列表（前 10 筆）
    const waitingList = await prisma.reservation.findMany({
      where: {
        teamId,
        reservationDate: dateObj,
        status: 'WAITING',
      },
      orderBy: { sequenceNumber: 'asc' },
      take: 10,
      select: {
        id: true,
        sequenceNumber: true,
        visitorName: true,
        visitorPhone: true,
        createdAt: true,
        notes: true,
      },
    })

    return apiSuccess({
      team: {
        id: team.id,
        name: team.name,
      },
      date,
      currentServing: team.currentServing
        ? {
            sequenceNumber: team.currentServing.currentSequenceNumber,
            reservation: team.currentServing.reservation
              ? {
                  id: team.currentServing.reservation.id,
                  visitorName: team.currentServing.reservation.visitorName,
                  visitorPhone: maskPhone(
                    team.currentServing.reservation.visitorPhone
                  ),
                  status: team.currentServing.reservation.status,
                  calledAt: team.currentServing.reservation.calledAt,
                }
              : null,
          }
        : null,
      queue: {
        waiting: stats.waiting,
        called: stats.called,
        inProgress: stats.inProgress,
        completed: stats.completed,
        noShow: stats.noShow,
        cancelled: stats.cancelled,
        total: stats.total,
      },
      waitingList: waitingList.map((r) => ({
        ...r,
        visitorPhone: maskPhone(r.visitorPhone),
      })),
      config: {
        slotDurationMinutes: team.reservationConfig.slotDurationMinutes,
        maxConcurrentCapacity: team.reservationConfig.maxConcurrentCapacity,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}
