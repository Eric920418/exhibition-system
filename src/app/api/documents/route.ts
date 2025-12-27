import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createDocumentSchema } from '@/lib/validations/document'
import { createAuditLog, AuditAction } from '@/lib/audit-log'

/**
 * GET /api/documents
 * 獲取文件列表（支援分頁和展覽篩選）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const exhibitionId = searchParams.get('exhibitionId') || undefined
    const type = searchParams.get('type') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    // 構建查詢條件
    const where: any = {}

    if (exhibitionId) {
      where.exhibitionId = exhibitionId
    }

    if (type && ['PROPOSAL', 'DESIGN', 'PLAN', 'OTHER'].includes(type)) {
      where.type = type
    }

    // 搜尋功能：搜尋文件標題
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    // 查詢總數和數據
    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ uploadedAt: 'desc' }],
        include: {
          exhibition: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/documents
 * 創建文件記錄（通常在檔案上傳後調用）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const body = await request.json()
    const data = createDocumentSchema.parse(body)

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
      return apiError('沒有權限上傳文件到此展覽', 403)
    }

    // 創建文件記錄
    const document = await prisma.document.create({
      data: {
        ...data,
        uploadedBy: user.id,
      },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 記錄審計日誌
    await createAuditLog({
      action: AuditAction.FILE_UPLOAD,
      userId: user.id,
      entityType: 'Document',
      entityId: document.id,
      metadata: {
        title: document.title,
        type: document.type,
        exhibitionId: document.exhibitionId,
        fileSize: document.fileSize,
      },
    })

    return apiSuccess(document, '文件記錄創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
