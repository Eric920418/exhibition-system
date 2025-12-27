import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiSuccess,
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { reservationStatsQuerySchema } from '@/lib/validations/reservation'

/**
 * GET /api/reservations/stats
 * 獲取預約統計數據（需認證）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const query = reservationStatsQuerySchema.parse({
      teamId: searchParams.get('teamId') || undefined,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    const startDate = new Date(query.startDate + 'T00:00:00.000Z')
    const endDate = new Date(query.endDate + 'T23:59:59.999Z')

    // 構建查詢條件
    const where: {
      reservationDate: { gte: Date; lte: Date }
      teamId?: string
      team?: { exhibition: { createdBy: string } }
    } = {
      reservationDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (query.teamId) {
      // 驗證權限
      const team = await prisma.team.findUnique({
        where: { id: query.teamId },
        include: { exhibition: { select: { createdBy: true } } },
      })

      if (!team) {
        return apiError('找不到指定的組別', 404)
      }

      if (
        user.role !== 'SUPER_ADMIN' &&
        team.exhibition.createdBy !== user.id &&
        team.leaderId !== user.id
      ) {
        return apiError('沒有權限查看此統計', 403)
      }

      where.teamId = query.teamId
    } else if (user.role !== 'SUPER_ADMIN') {
      // 非 SUPER_ADMIN 只能看自己創建的展覽
      where.team = {
        exhibition: { createdBy: user.id },
      }
    }

    // 1. 基本統計
    const [
      totalReservations,
      completedCount,
      cancelledCount,
      noShowCount,
      waitingCount,
    ] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.reservation.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.reservation.count({ where: { ...where, status: 'NO_SHOW' } }),
      prisma.reservation.count({ where: { ...where, status: 'WAITING' } }),
    ])

    // 2. 計算平均等候時間（從叫號到完成）
    const completedReservations = await prisma.reservation.findMany({
      where: { ...where, status: 'COMPLETED', calledAt: { not: null }, completedAt: { not: null } },
      select: { calledAt: true, completedAt: true },
    })

    let avgServiceTimeMinutes = 0
    if (completedReservations.length > 0) {
      const totalServiceTime = completedReservations.reduce((sum, r) => {
        if (r.calledAt && r.completedAt) {
          const serviceTime = (r.completedAt.getTime() - r.calledAt.getTime()) / 60000
          return sum + serviceTime
        }
        return sum
      }, 0)
      avgServiceTimeMinutes = Math.round(totalServiceTime / completedReservations.length)
    }

    // 3. 每日統計
    const dailyStats = await prisma.reservation.groupBy({
      by: ['reservationDate'],
      where,
      _count: { _all: true },
    })

    // 4. 狀態分布
    const statusDistribution = await prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    })

    // 5. 尖峰時段分析（按小時）
    const reservationsWithTime = await prisma.reservation.findMany({
      where,
      select: { createdAt: true },
    })

    const hourlyDistribution: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0
    }

    reservationsWithTime.forEach((r) => {
      const hour = r.createdAt.getHours()
      hourlyDistribution[hour]++
    })

    // 找出尖峰時段
    const peakHour = Object.entries(hourlyDistribution).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    )

    // 6. 組別統計（如果沒有指定 teamId）
    let teamStats: { teamId: string; teamName: string; total: number; completed: number }[] = []
    if (!query.teamId) {
      const teamCounts = await prisma.reservation.groupBy({
        by: ['teamId'],
        where,
        _count: { _all: true },
      })

      const teamCompletedCounts = await prisma.reservation.groupBy({
        by: ['teamId'],
        where: { ...where, status: 'COMPLETED' },
        _count: { _all: true },
      })

      const teamIds = teamCounts.map((t) => t.teamId)
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true },
      })

      teamStats = teamCounts.map((t) => {
        const team = teams.find((tm) => tm.id === t.teamId)
        const completedData = teamCompletedCounts.find((c) => c.teamId === t.teamId)
        return {
          teamId: t.teamId,
          teamName: team?.name || '未知組別',
          total: t._count._all,
          completed: completedData?._count._all || 0,
        }
      })
    }

    return apiSuccess({
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      summary: {
        total: totalReservations,
        completed: completedCount,
        cancelled: cancelledCount,
        noShow: noShowCount,
        waiting: waitingCount,
        completionRate: totalReservations > 0
          ? Math.round((completedCount / totalReservations) * 100)
          : 0,
        noShowRate: totalReservations > 0
          ? Math.round((noShowCount / totalReservations) * 100)
          : 0,
        cancelRate: totalReservations > 0
          ? Math.round((cancelledCount / totalReservations) * 100)
          : 0,
        avgServiceTimeMinutes,
      },
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      dailyStats: dailyStats
        .map((d) => ({
          date: d.reservationDate.toISOString().split('T')[0],
          count: d._count._all,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      })),
      peakHour: {
        hour: peakHour.hour,
        count: peakHour.count,
        label: `${peakHour.hour.toString().padStart(2, '0')}:00 - ${(peakHour.hour + 1).toString().padStart(2, '0')}:00`,
      },
      teamStats,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
