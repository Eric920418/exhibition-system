import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { cancelReservationSchema } from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reservations/[id]
 * 獲取單一預約詳情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    const reservation = await prisma.reservation.findUnique({
      where: { id },
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

    if (!reservation) {
      return apiError('找不到該預約', 404)
    }

    // 如果提供了手機號碼，需要驗證
    if (phone && reservation.visitorPhone !== phone) {
      return apiError('手機號碼驗證失敗', 403)
    }

    // 遮蔽敏感資訊（如果沒有提供正確的手機號碼）
    const isMasked = !phone || reservation.visitorPhone !== phone

    return apiSuccess({
      id: reservation.id,
      sequenceNumber: reservation.sequenceNumber,
      visitorName: isMasked
        ? maskName(reservation.visitorName)
        : reservation.visitorName,
      visitorPhone: isMasked
        ? maskPhone(reservation.visitorPhone)
        : reservation.visitorPhone,
      status: reservation.status,
      reservationDate: reservation.reservationDate.toISOString().split('T')[0],
      estimatedWaitMinutes: reservation.estimatedWaitMinutes,
      checkInTime: reservation.checkInTime,
      calledAt: reservation.calledAt,
      completedAt: reservation.completedAt,
      notes: reservation.notes,
      createdAt: reservation.createdAt,
      team: reservation.team,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/reservations/[id]
 * 取消預約（需要手機號碼驗證）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { phone } = cancelReservationSchema.parse(searchParams)

    // 查詢預約
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!reservation) {
      return apiError('找不到該預約', 404)
    }

    // 驗證手機號碼
    if (reservation.visitorPhone !== phone) {
      return apiError('手機號碼驗證失敗', 403)
    }

    // 檢查是否可以取消
    if (reservation.status !== 'WAITING') {
      const statusText: Record<string, string> = {
        CALLED: '已叫號',
        IN_PROGRESS: '服務中',
        COMPLETED: '已完成',
        CANCELLED: '已取消',
        NO_SHOW: '已標記未到場',
      }
      return apiError(
        `無法取消：預約狀態為「${statusText[reservation.status] || reservation.status}」`,
        400
      )
    }

    // 更新狀態為取消
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CANCEL,
      entityType: 'Reservation',
      entityId: id,
      metadata: {
        teamId: reservation.teamId,
        teamName: reservation.team.name,
        sequenceNumber: reservation.sequenceNumber,
        visitorPhone: maskPhone(phone),
        cancelledBy: 'visitor',
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        id: updated.id,
        status: updated.status,
      },
      '預約已取消'
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 遮蔽姓名
 */
function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}

/**
 * 遮蔽手機號碼
 */
function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}
