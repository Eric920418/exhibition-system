import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'

/**
 * GET /api/system-settings/[key]
 * 獲取系統設置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    if (!setting) {
      return apiError('設置不存在', 404)
    }

    return apiSuccess(setting.value)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/system-settings/[key]
 * 更新系統設置（僅限超級管理員）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 只有超級管理員可以修改系統設置
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限修改系統設置', 403)
    }

    const { key } = await params
    const body = await request.json()

    // 更新或創建設置
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: body,
      },
      create: {
        key,
        value: body,
        description: `System setting: ${key}`,
      },
    })

    return apiSuccess(setting.value, '設置已更新')
  } catch (error) {
    return handleApiError(error)
  }
}
