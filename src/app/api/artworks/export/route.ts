import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, requireAuth } from '@/lib/api-response'
import {
  createExportResponse,
  validateExportFormat,
  formatDateTime,
  formatBoolean,
  ExportColumn,
} from '@/lib/export'

interface ArtworkExport {
  id: string
  title: string
  concept: string | null
  thumbnailUrl: string | null
  mediaUrls: string[]
  isPublished: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  team: {
    name: string
    exhibition: {
      name: string
      year: number
    }
  }
  creator: {
    name: string
  } | null
}

const columns: ExportColumn<ArtworkExport>[] = [
  { key: 'id', header: '作品 ID' },
  { key: 'title', header: '作品標題' },
  { key: 'team.exhibition.name', header: '所屬展覽' },
  { key: 'team.exhibition.year', header: '展覽年份' },
  { key: 'team.name', header: '所屬團隊' },
  { key: 'concept', header: '創作概念' },
  {
    key: 'mediaUrls',
    header: '媒體數量',
    formatter: (v) => (v as string[])?.length || 0,
  },
  {
    key: 'isPublished',
    header: '已發布',
    formatter: (v) => formatBoolean(v as boolean),
  },
  { key: 'displayOrder', header: '排序' },
  { key: 'creator.name', header: '創建者' },
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
 * GET /api/artworks/export
 * 匯出作品數據（需認證）
 *
 * Query params:
 * - format: csv | json | xlsx (default: csv)
 * - exhibitionId: 篩選展覽
 * - teamId: 篩選團隊
 * - isPublished: true | false
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const format = validateExportFormat(searchParams.get('format'))
    const exhibitionId = searchParams.get('exhibitionId')
    const teamId = searchParams.get('teamId')
    const isPublished = searchParams.get('isPublished')

    // 構建查詢條件
    const where: Record<string, unknown> = {}

    if (teamId) {
      where.teamId = teamId
    }

    if (exhibitionId) {
      where.team = { exhibitionId }
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true'
    }

    // 非超級管理員的權限過濾
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role === 'CURATOR') {
        // 策展人只能匯出自己展覽的作品
        where.team = {
          ...(where.team as object),
          exhibition: { createdBy: user.id },
        }
      } else {
        // 組長只能匯出自己團隊的作品
        where.team = {
          ...(where.team as object),
          leaderId: user.id,
        }
      }
    }

    // 獲取數據
    const artworks = await prisma.artwork.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        concept: true,
        thumbnailUrl: true,
        mediaUrls: true,
        isPublished: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            name: true,
            exhibition: {
              select: {
                name: true,
                year: true,
              },
            },
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
      },
    })

    const today = new Date().toISOString().split('T')[0]

    return createExportResponse({
      filename: `artworks_${today}`,
      format,
      columns,
      data: artworks,
      sheetName: '作品列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
