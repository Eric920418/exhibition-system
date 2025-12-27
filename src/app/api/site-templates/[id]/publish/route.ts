import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { publishTemplateSchema } from '@/lib/validations/template'
import { createAuditLog, AuditAction } from '@/lib/audit-log'

/**
 * POST /api/site-templates/[id]/publish
 * 發布或取消發布模板
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await params
    const body = await request.json()
    const { isPublished } = publishTemplateSchema.parse(body)

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
      return apiError('沒有權限發布此模板', 403)
    }

    // 如果要發布，先取消此展覽的其他已發布模板
    if (isPublished) {
      await prisma.siteTemplate.updateMany({
        where: {
          exhibitionId: template.exhibitionId,
          id: { not: id },
          isPublished: true,
        },
        data: { isPublished: false },
      })
    }

    // 更新模板發布狀態
    const updatedTemplate = await prisma.siteTemplate.update({
      where: { id },
      data: { isPublished },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
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
        action: isPublished ? 'publish' : 'unpublish',
        name: template.name,
      },
    })

    return apiSuccess(
      updatedTemplate,
      isPublished ? '模板已發布' : '模板已取消發布'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
