import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, requireAuth } from '@/lib/api-response'
import {
  createExportResponse,
  validateExportFormat,
  formatDateTime,
  ExportColumn,
} from '@/lib/export'

interface VenueExport {
  id: string
  name: string
  address: string | null
  capacity: number | null
  floorPlanUrl: string | null
  createdAt: Date
  exhibition: {
    name: string
    year: number
  }
}

const columns: ExportColumn<VenueExport>[] = [
  { key: 'id', header: '場地 ID' },
  { key: 'name', header: '場地名稱' },
  { key: 'exhibition.name', header: '所屬展覽' },
  { key: 'exhibition.year', header: '展覽年份' },
  { key: 'address', header: '地址' },
  { key: 'capacity', header: '容納人數' },
  {
    key: 'floorPlanUrl',
    header: '有平面圖',
    formatter: (v) => (v ? '是' : '否'),
  },
  {
    key: 'createdAt',
    header: '創建時間',
    formatter: (v) => formatDateTime(v as Date),
  },
]

/**
 * GET /api/venues/export
 * 匯出場地數據（需認證）
 *
 * Query params:
 * - format: csv | json | xlsx (default: csv)
 * - exhibitionId: 篩選展覽
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const format = validateExportFormat(searchParams.get('format'))
    const exhibitionId = searchParams.get('exhibitionId')

    // 構建查詢條件
    const where: Record<string, unknown> = {}

    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    // 非超級管理員只能匯出自己展覽的場地
    if (user.role !== 'SUPER_ADMIN') {
      where.exhibition = { createdBy: user.id }
    }

    // 獲取數據
    const venues = await prisma.venue.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        address: true,
        capacity: true,
        floorPlanUrl: true,
        createdAt: true,
        exhibition: {
          select: {
            name: true,
            year: true,
          },
        },
      },
    })

    const today = new Date().toISOString().split('T')[0]

    return createExportResponse({
      filename: `venues_${today}`,
      format,
      columns,
      data: venues,
      sheetName: '場地列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
