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

interface TeamExport {
  id: string
  name: string
  slug: string
  description: string | null
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  exhibition: {
    name: string
    year: number
  }
  leader: {
    name: string
    email: string
  } | null
  _count: {
    members: number
    artworks: number
  }
}

const columns: ExportColumn<TeamExport>[] = [
  { key: 'id', header: '團隊 ID' },
  { key: 'name', header: '團隊名稱' },
  { key: 'slug', header: 'Slug' },
  { key: 'exhibition.name', header: '所屬展覽' },
  { key: 'exhibition.year', header: '展覽年份' },
  { key: 'description', header: '描述' },
  { key: 'leader.name', header: '組長' },
  { key: 'leader.email', header: '組長 Email' },
  { key: '_count.members', header: '成員數量' },
  { key: '_count.artworks', header: '作品數量' },
  { key: 'displayOrder', header: '排序' },
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
 * GET /api/teams/export
 * 匯出團隊數據（需認證）
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

    // 非超級管理員的權限過濾
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role === 'CURATOR') {
        where.exhibition = { createdBy: user.id }
      } else {
        where.leaderId = user.id
      }
    }

    // 獲取數據
    const teams = await prisma.team.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
        exhibition: {
          select: {
            name: true,
            year: true,
          },
        },
        leader: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            artworks: true,
          },
        },
      },
    })

    const today = new Date().toISOString().split('T')[0]

    return createExportResponse({
      filename: `teams_${today}`,
      format,
      columns,
      data: teams,
      sheetName: '團隊列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
