import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateSiteTemplateSchema } from '@/lib/validations/template'
import { createAuditLog, AuditAction } from '@/lib/audit-log'

/**
 * GET /api/site-templates/[id]
 * 獲取單個網站模板
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await params

    const template = await prisma.siteTemplate.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
            createdBy: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!template) {
      return apiError('模板不存在', 404)
    }

    // 權限檢查：超級管理員或展覽創建者
    const user = session!.user
    if (
      user.role !== 'SUPER_ADMIN' &&
      template.exhibition.createdBy !== user.id
    ) {
      return apiError('沒有權限查看此模板', 403)
    }

    return apiSuccess(template)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/site-templates/[id]
 * 更新網站模板
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await params
    const body = await request.json()
    const data = updateSiteTemplateSchema.parse(body)

    // 查詢模板
    const template = await prisma.siteTemplate.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!template) {
      return apiError('模板不存在', 404)
    }

    // 權限檢查：超級管理員或展覽創建者
    if (
      user.role !== 'SUPER_ADMIN' &&
      template.exhibition.createdBy !== user.id
    ) {
      return apiError('沒有權限編輯此模板', 403)
    }

    // 更新模板
    const updatedTemplate = await prisma.siteTemplate.update({
      where: { id },
      data,
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 記錄審計日誌
    await createAuditLog({
      action: AuditAction.OTHER,
      userId: user.id,
      entityType: 'SiteTemplate',
      entityId: id,
      metadata: {
        action: 'update',
        changes: data,
      },
    })

    return apiSuccess(updatedTemplate, '模板更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/site-templates/[id]
 * 刪除網站模板
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await params

    // 查詢模板
    const template = await prisma.siteTemplate.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!template) {
      return apiError('模板不存在', 404)
    }

    // 權限檢查：超級管理員或展覽創建者
    if (
      user.role !== 'SUPER_ADMIN' &&
      template.exhibition.createdBy !== user.id
    ) {
      return apiError('沒有權限刪除此模板', 403)
    }

    // 刪除模板
    await prisma.siteTemplate.delete({
      where: { id },
    })

    // 記錄審計日誌
    await createAuditLog({
      action: AuditAction.OTHER,
      userId: user.id,
      entityType: 'SiteTemplate',
      entityId: id,
      metadata: {
        action: 'delete',
        name: template.name,
      },
    })

    return apiSuccess(null, '模板刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
