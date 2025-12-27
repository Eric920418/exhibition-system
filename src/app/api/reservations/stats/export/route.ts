import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  apiError,
  handleApiError,
  requireAuth,
} from '@/lib/api-response'
import { reservationExportSchema } from '@/lib/validations/reservation'

/**
 * GET /api/reservations/stats/export
 * 匯出預約數據（需認證）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const query = reservationExportSchema.parse({
      teamId: searchParams.get('teamId') || undefined,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      format: searchParams.get('format') || 'csv',
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
        return apiError('沒有權限匯出此數據', 403)
      }

      where.teamId = query.teamId
    } else if (user.role !== 'SUPER_ADMIN') {
      where.team = {
        exhibition: { createdBy: user.id },
      }
    }

    // 獲取數據
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        team: {
          select: {
            name: true,
            exhibition: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { reservationDate: 'asc' },
        { sequenceNumber: 'asc' },
      ],
    })

    if (query.format === 'json') {
      const jsonData = reservations.map((r) => ({
        id: r.id,
        exhibitionName: r.team.exhibition.name,
        teamName: r.team.name,
        sequenceNumber: r.sequenceNumber,
        visitorName: r.visitorName,
        visitorPhone: maskPhone(r.visitorPhone),
        status: r.status,
        reservationDate: r.reservationDate.toISOString().split('T')[0],
        estimatedWaitMinutes: r.estimatedWaitMinutes,
        createdAt: r.createdAt.toISOString(),
        calledAt: r.calledAt?.toISOString() || null,
        completedAt: r.completedAt?.toISOString() || null,
      }))

      return new Response(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="reservations_${query.startDate}_${query.endDate}.json"`,
        },
      })
    }

    // CSV 格式
    const headers = [
      '預約 ID',
      '展覽名稱',
      '組別名稱',
      '序號',
      '訪客姓名',
      '訪客電話',
      '狀態',
      '預約日期',
      '預估等候（分鐘）',
      '創建時間',
      '叫號時間',
      '完成時間',
    ]

    const statusLabels: Record<string, string> = {
      WAITING: '等待中',
      CALLED: '已叫號',
      IN_PROGRESS: '服務中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      NO_SHOW: '未到場',
    }

    const rows = reservations.map((r) => [
      r.id,
      r.team.exhibition.name,
      r.team.name,
      r.sequenceNumber,
      r.visitorName,
      maskPhone(r.visitorPhone),
      statusLabels[r.status] || r.status,
      r.reservationDate.toISOString().split('T')[0],
      r.estimatedWaitMinutes ?? '',
      formatDateTime(r.createdAt),
      r.calledAt ? formatDateTime(r.calledAt) : '',
      r.completedAt ? formatDateTime(r.completedAt) : '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n')

    // 添加 BOM 以支援 Excel 正確顯示中文
    const bom = '\uFEFF'
    const csvContent = bom + csv

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservations_${query.startDate}_${query.endDate}.csv"`,
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

function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
