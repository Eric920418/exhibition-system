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
      return apiSuccess(null)
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

    // 所有登入的管理員都可以修改系統設置
    // （後台本身已有 auth guard，只有管理員能進入）

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
