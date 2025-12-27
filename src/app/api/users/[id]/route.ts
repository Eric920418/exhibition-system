import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/validations/user'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/users/[id]
 * 獲取單個用戶詳情（SUPER_ADMIN 或本人）
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const currentUser = requireAuth(session)

    const { id } = await context.params

    // 檢查權限（超級管理員或本人可以查看）
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.id !== id) {
      return apiError('沒有權限查看此用戶', 403)
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
            exhibitionsCreated: true,
            exhibitionMembers: true,
            teamsLed: true,
            artworksCreated: true,
          },
        },
      },
    })

    if (!user) {
      return apiError('找不到指定的用戶', 404)
    }

    return apiSuccess(user)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/users/[id]
 * 更新用戶資訊（SUPER_ADMIN 或本人，部分欄位僅 SUPER_ADMIN）
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const currentUser = requireAuth(session)

    const { id } = await context.params

    // 檢查用戶是否存在
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return apiError('找不到指定的用戶', 404)
    }

    // 檢查權限
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'
    const isSelf = currentUser.id === id

    if (!isSuperAdmin && !isSelf) {
      return apiError('沒有權限編輯此用戶', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // 僅超級管理員可以修改角色和 isActive
    if (!isSuperAdmin) {
      if (data.role !== undefined || data.isActive !== undefined) {
        return apiError('沒有權限修改角色或啟用狀態', 403)
      }
    }

    // 如果更新郵箱，檢查是否已存在
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existing && existing.id !== id) {
        return apiError('該電子郵件已被使用', 409)
      }
    }

    // 準備更新數據
    const updateData: any = {}

    if (data.email) updateData.email = data.email
    if (data.name) updateData.name = data.name
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
    if (isSuperAdmin && data.role !== undefined) updateData.role = data.role
    if (isSuperAdmin && data.isActive !== undefined) updateData.isActive = data.isActive

    // 如果提供新密碼，加密後更新
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    // 更新用戶
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        updatedAt: true,
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.USER_UPDATE,
      userId: currentUser.id,
      entityType: 'User',
      entityId: id,
      metadata: {
        updates: Object.keys(updateData).filter(key => key !== 'passwordHash'),
        updatedBy: currentUser.id,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(updated, '用戶更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/users/[id]
 * 刪除用戶（僅 SUPER_ADMIN）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    const currentUser = requireAuth(session)

    // 僅超級管理員可以刪除用戶
    if (currentUser.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限刪除用戶', 403)
    }

    const { id } = await context.params

    // 不能刪除自己
    if (currentUser.id === id) {
      return apiError('不能刪除自己', 400)
    }

    // 檢查用戶是否存在
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            exhibitionsCreated: true,
            teamsLed: true,
          },
        },
      },
    })

    if (!user) {
      return apiError('找不到指定的用戶', 404)
    }

    // 檢查是否有關聯數據（可選：防止誤刪）
    if (user._count.exhibitionsCreated > 0 || user._count.teamsLed > 0) {
      return apiError('此用戶還有關聯的展覽或團隊，無法刪除', 400)
    }

    // 刪除用戶
    await prisma.user.delete({
      where: { id },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.USER_DELETE,
      userId: currentUser.id,
      entityType: 'User',
      entityId: id,
      metadata: {
        email: user.email,
        deletedBy: currentUser.id,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess({ id }, '用戶刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
