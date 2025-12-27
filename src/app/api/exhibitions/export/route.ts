import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, requireAuth } from '@/lib/api-response'
import {
  createExportResponse,
  validateExportFormat,
  formatDate,
  formatDateTime,
  formatStatus,
  formatBoolean,
  ExportColumn,
} from '@/lib/export'

interface ExhibitionExport {
  id: string
  name: string
  year: number
  slug: string
  description: string | null
  startDate: Date
  endDate: Date
  status: string
  isActive: boolean
  posterUrl: string | null
  createdAt: Date
  updatedAt: Date
  creator: {
    name: string
    email: string
  } | null
  _count: {
    teams: number
    members: number
  }
}

const columns: ExportColumn<ExhibitionExport>[] = [
  { key: 'id', header: '展覽 ID' },
  { key: 'name', header: '展覽名稱' },
  { key: 'year', header: '年份' },
  { key: 'slug', header: 'Slug' },
  { key: 'description', header: '描述' },
  {
    key: 'startDate',
    header: '開始日期',
    formatter: (v) => formatDate(v as Date),
  },
  {
    key: 'endDate',
    header: '結束日期',
    formatter: (v) => formatDate(v as Date),
  },
  {
    key: 'status',
    header: '狀態',
    formatter: (v) => formatStatus(v as string),
  },
  {
    key: 'isActive',
    header: '是否啟用',
    formatter: (v) => formatBoolean(v as boolean),
  },
  { key: '_count.teams', header: '團隊數量' },
  { key: '_count.members', header: '成員數量' },
  { key: 'creator.name', header: '創建者' },
  { key: 'creator.email', header: '創建者 Email' },
  {
    key: 'createdAt',
    header: '創建時間',
    formatter: (v) => formatDateTime(v as Date),
  },
  {
    key: 'updatedAt',
    header: '更新時間',
    formatter: (v) => formatDateTime(v as Date),
  },
]

/**
 * GET /api/exhibitions/export
 * 匯出展覽數據（需認證）
 *
 * Query params:
 * - format: csv | json | xlsx (default: csv)
 * - year: 篩選年份
 * - status: DRAFT | PUBLISHED | ARCHIVED
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const format = validateExportFormat(searchParams.get('format'))
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    // 構建查詢條件
    const where: Record<string, unknown> = {}

    // 非超級管理員只能匯出自己創建的展覽
    if (user.role !== 'SUPER_ADMIN') {
      where.createdBy = user.id
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (status) {
      where.status = status
    }

    // 獲取數據
    const exhibitions = await prisma.exhibition.findMany({
      where,
      orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        name: true,
        year: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        isActive: true,
        posterUrl: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            teams: true,
            members: true,
          },
        },
      },
    })

    const today = new Date().toISOString().split('T')[0]

    return createExportResponse({
      filename: `exhibitions_${today}`,
      format,
      columns,
      data: exhibitions,
      sheetName: '展覽列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
