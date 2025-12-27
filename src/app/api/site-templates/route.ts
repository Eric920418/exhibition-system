import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createSiteTemplateSchema } from '@/lib/validations/template'
import { createAuditLog, AuditAction } from '@/lib/audit-log'

/**
 * GET /api/site-templates
 * 獲取網站模板列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const exhibitionId = searchParams.get('exhibitionId') || undefined

    // 構建查詢條件
    const where: any = {}

    if (exhibitionId) {
      where.exhibitionId = exhibitionId

      // 檢查權限：超級管理員或展覽創建者
      const exhibition = await prisma.exhibition.findUnique({
        where: { id: exhibitionId },
        select: { createdBy: true },
      })

      if (!exhibition) {
        return apiError('展覽不存在', 404)
      }

      if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
        return apiError('沒有權限查看此展覽的模板', 403)
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      // 非超級管理員只能看到自己創建的展覽的模板
      where.exhibition = {
        createdBy: user.id,
      }
    }

    const templates = await prisma.siteTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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

    return apiSuccess({ templates })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/site-templates
 * 創建網站模板
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const body = await request.json()
    const data = createSiteTemplateSchema.parse(body)

    // 檢查展覽是否存在
    const exhibition = await prisma.exhibition.findUnique({
      where: { id: data.exhibitionId },
      select: {
        id: true,
        name: true,
        createdBy: true,
      },
    })

    if (!exhibition) {
      return apiError('展覽不存在', 404)
    }

    // 權限檢查：超級管理員或展覽創建者
    if (user.role !== 'SUPER_ADMIN' && exhibition.createdBy !== user.id) {
      return apiError('沒有權限為此展覽創建模板', 403)
    }

    // 創建模板
    const template = await prisma.siteTemplate.create({
      data: {
        ...data,
        createdBy: user.id,
      },
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
      entityId: template.id,
      metadata: {
        action: 'create',
        name: template.name,
        exhibitionId: template.exhibitionId,
      },
    })

    return apiSuccess(template, '模板創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
