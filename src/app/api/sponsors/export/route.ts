import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, requireAuth } from '@/lib/api-response'
import {
  createExportResponse,
  validateExportFormat,
  formatDateTime,
  formatStatus,
  maskSensitive,
  ExportColumn,
} from '@/lib/export'

interface SponsorExport {
  id: string
  name: string
  tier: string | null
  logoUrl: string | null
  websiteUrl: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  isContactPublic: boolean
  displayOrder: number
  createdAt: Date
  exhibition: {
    name: string
    year: number
  }
}

const columns: ExportColumn<SponsorExport>[] = [
  { key: 'id', header: '贊助商 ID' },
  { key: 'name', header: '贊助商名稱' },
  { key: 'exhibition.name', header: '所屬展覽' },
  { key: 'exhibition.year', header: '展覽年份' },
  {
    key: 'tier',
    header: '贊助等級',
    formatter: (v) => formatStatus(v as string),
  },
  { key: 'websiteUrl', header: '網站' },
  { key: 'contactName', header: '聯絡人' },
  {
    key: 'contactEmail',
    header: '聯絡 Email',
    formatter: (v) => (v ? maskSensitive(v as string, 3, 8) : ''),
  },
  {
    key: 'contactPhone',
    header: '聯絡電話',
    formatter: (v) => (v ? maskSensitive(v as string, 4, 2) : ''),
  },
  {
    key: 'isContactPublic',
    header: '公開聯絡資訊',
    formatter: (v) => (v ? '是' : '否'),
  },
  { key: 'displayOrder', header: '排序' },
  {
    key: 'createdAt',
    header: '創建時間',
    formatter: (v) => formatDateTime(v as Date),
  },
]

/**
 * GET /api/sponsors/export
 * 匯出贊助商數據（需認證）
 *
 * Query params:
 * - format: csv | json | xlsx (default: csv)
 * - exhibitionId: 篩選展覽
 * - tier: PLATINUM | GOLD | SILVER | BRONZE | PARTNER
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const format = validateExportFormat(searchParams.get('format'))
    const exhibitionId = searchParams.get('exhibitionId')
    const tier = searchParams.get('tier')

    // 構建查詢條件
    const where: Record<string, unknown> = {}

    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    if (tier) {
      where.tier = tier
    }

    // 非超級管理員只能匯出自己展覽的贊助商
    if (user.role !== 'SUPER_ADMIN') {
      where.exhibition = { createdBy: user.id }
    }

    // 獲取數據
    const sponsors = await prisma.sponsor.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        tier: true,
        logoUrl: true,
        websiteUrl: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        isContactPublic: true,
        displayOrder: true,
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
      filename: `sponsors_${today}`,
      format,
      columns,
      data: sponsors,
      sheetName: '贊助商列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
