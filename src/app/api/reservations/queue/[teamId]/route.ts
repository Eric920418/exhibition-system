import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { formatDateString } from '@/lib/reservation-utils'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * GET /api/reservations/queue/[teamId]
 * 獲取完整等候隊列（需認證）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || formatDateString(new Date())
    const status = searchParams.get('status') // WAITING, CALLED, COMPLETED, etc.
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // 檢查組別和權限
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
      return apiError('沒有權限查看此組別的隊列', 403)
    }

    const dateObj = new Date(date + 'T00:00:00.000Z')

    // 構建查詢條件
    const where: any = {
      teamId,
      reservationDate: dateObj,
    }

    if (status) {
      where.status = status
    }

    const skip = (page - 1) * limit

    const [total, reservations] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sequenceNumber: 'asc' },
        select: {
          id: true,
          sequenceNumber: true,
          visitorName: true,
          visitorPhone: true,
          status: true,
          estimatedWaitMinutes: true,
          checkInTime: true,
          calledAt: true,
          completedAt: true,
          notes: true,
          createdAt: true,
        },
      }),
    ])

    return apiSuccess({
      date,
      reservations: reservations.map((r) => ({
        ...r,
        visitorPhone: maskPhone(r.visitorPhone),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
