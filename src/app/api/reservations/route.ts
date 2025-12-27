import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { createReservationSchema } from '@/lib/validations/reservation'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'
import {
  generateSequenceNumber,
  calculateEstimatedWaitTime,
  checkPhoneRateLimit,
  incrementPhoneRateLimit,
  parseDateString,
  getQueuePosition,
} from '@/lib/reservation-utils'

/**
 * POST /api/reservations
 * 創建預約（取號）- 公開 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReservationSchema.parse(body)

    // 檢查組別是否存在且預約功能已啟用
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        reservationConfig: true,
        exhibition: {
          select: {
            id: true,
            name: true,
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

    if (team.exhibition.status !== 'PUBLISHED') {
      return apiError('此展覽尚未開放', 400)
    }

    // 檢查預約日期是否有效（只能預約今天或未來）
    const reservationDate = parseDateString(data.reservationDate)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    if (reservationDate < today) {
      return apiError('不能預約過去的日期', 400)
    }

    // 檢查是否在營業時間內（只對今天的預約檢查）
    const isToday = reservationDate.getTime() === today.getTime()
    if (isToday) {
      const now = new Date()
      const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes()
      const endTime =
        team.reservationConfig.dailyEndTime.getUTCHours() * 60 +
        team.reservationConfig.dailyEndTime.getUTCMinutes()

      if (currentTime >= endTime) {
        return apiError('今日預約已結束，請明天再試', 400)
      }
    }

    // 檢查手機號碼的每日預約限制
    const rateCheck = await checkPhoneRateLimit(
      data.visitorPhone,
      data.reservationDate
    )

    if (!rateCheck.allowed) {
      return apiError(
        `每日最多可預約 3 次，您今日已預約 ${rateCheck.current} 次`,
        429
      )
    }

    // 檢查是否已有相同手機的等待中預約
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        teamId: data.teamId,
        visitorPhone: data.visitorPhone,
        reservationDate,
        status: { in: ['WAITING', 'CALLED'] },
      },
    })

    if (existingReservation) {
      return apiError(
        `您已有等待中的預約（號碼：${existingReservation.sequenceNumber}）`,
        409
      )
    }

    // 生成序號
    const sequenceNumber = await generateSequenceNumber(
      data.teamId,
      data.reservationDate
    )

    // 計算預估等候時間
    const estimatedWaitMinutes = await calculateEstimatedWaitTime(
      data.teamId,
      sequenceNumber
    )

    // 創建預約
    const reservation = await prisma.reservation.create({
      data: {
        teamId: data.teamId,
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        sequenceNumber,
        reservationDate,
        slotDatetime: new Date(), // 實際服務時間在叫號時更新
        estimatedWaitMinutes,
        status: 'WAITING',
        notes: data.notes,
      },
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

    // 增加手機號碼的預約計數
    await incrementPhoneRateLimit(data.visitorPhone, data.reservationDate)

    // 獲取隊列位置
    const queuePosition = await getQueuePosition(
      data.teamId,
      reservationDate,
      sequenceNumber
    )

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.RESERVATION_CREATE,
      entityType: 'Reservation',
      entityId: reservation.id,
      metadata: {
        teamId: data.teamId,
        teamName: reservation.team.name,
        sequenceNumber,
        visitorPhone: maskPhone(data.visitorPhone),
        reservationDate: data.reservationDate,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(
      {
        reservation: {
          id: reservation.id,
          sequenceNumber: reservation.sequenceNumber,
          visitorName: reservation.visitorName,
          reservationDate: data.reservationDate,
          status: reservation.status,
          estimatedWaitMinutes: reservation.estimatedWaitMinutes,
          queuePosition,
          createdAt: reservation.createdAt,
        },
        team: reservation.team,
      },
      '預約成功！請記住您的號碼',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * 遮蔽手機號碼
 */
function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}
