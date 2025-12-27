import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, handleApiError, requireAuth } from '@/lib/api-response'
import {
  createExportResponse,
  validateExportFormat,
  formatDateTime,
  formatStatus,
  formatBoolean,
  maskSensitive,
  ExportColumn,
} from '@/lib/export'

interface UserExport {
  id: string
  email: string
  name: string
  role: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    teamsLed: number
    exhibitionMembers: number
    exhibitionsCreated: number
    artworksCreated: number
  }
}

const columns: ExportColumn<UserExport>[] = [
  { key: 'id', header: '用戶 ID' },
  { key: 'name', header: '姓名' },
  {
    key: 'email',
    header: 'Email',
    formatter: (v) => maskSensitive(v as string, 3, 8), // 遮罩 Email
  },
  {
    key: 'role',
    header: '角色',
    formatter: (v) => formatStatus(v as string),
  },
  {
    key: 'isActive',
    header: '是否啟用',
    formatter: (v) => formatBoolean(v as boolean),
  },
  {
    key: 'avatarUrl',
    header: '有頭像',
    formatter: (v) => (v ? '是' : '否'),
  },
  { key: '_count.teamsLed', header: '帶領團隊數' },
  { key: '_count.exhibitionMembers', header: '參與展覽數' },
  { key: '_count.exhibitionsCreated', header: '創建展覽數' },
  { key: '_count.artworksCreated', header: '創建作品數' },
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
 * GET /api/users/export
 * 匯出用戶數據（僅 SUPER_ADMIN）
 *
 * Query params:
 * - format: csv | json | xlsx (default: csv)
 * - role: SUPER_ADMIN | CURATOR | TEAM_LEADER
 * - isActive: true | false
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 只有超級管理員可以匯出用戶數據
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限匯出用戶數據', 403)
    }

    const searchParams = request.nextUrl.searchParams
    const format = validateExportFormat(searchParams.get('format'))
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')

    // 構建查詢條件
    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // 獲取數據
    const users = await prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            teamsLed: true,
            exhibitionMembers: true,
            exhibitionsCreated: true,
            artworksCreated: true,
          },
        },
      },
    })

    const today = new Date().toISOString().split('T')[0]

    return createExportResponse({
      filename: `users_${today}`,
      format,
      columns,
      data: users,
      sheetName: '用戶列表',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
