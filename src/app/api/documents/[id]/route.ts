import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { updateDocumentSchema } from '@/lib/validations/document'
import { createAuditLog, AuditAction } from '@/lib/audit-log'

/**
 * GET /api/documents/[id]
 * 獲取單個文件詳情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    requireAuth(session)

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
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

    if (!document) {
      return apiError('文件不存在', 404)
    }

    return apiSuccess(document)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/documents/[id]
 * 更新文件資訊（不包括檔案本身）
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
    const data = updateDocumentSchema.parse(body)

    // 查詢文件
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!document) {
      return apiError('文件不存在', 404)
    }

    // 權限檢查：超級管理員、展覽創建者、或上傳者本人
    if (
      user.role !== 'SUPER_ADMIN' &&
      document.exhibition.createdBy !== user.id &&
      document.uploadedBy !== user.id
    ) {
      return apiError('沒有權限編輯此文件', 403)
    }

    // 更新文件
    const updatedDocument = await prisma.document.update({
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
      action: AuditAction.FILE_DELETE,
      userId: user.id,
      entityType: 'Document',
      entityId: id,
      metadata: {
        action: 'update',
        changes: data,
      },
    })

    return apiSuccess(updatedDocument, '文件更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/documents/[id]
 * 刪除文件記錄（注意：不會刪除 MinIO 中的實際檔案）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const { id } = await params

    // 查詢文件
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        exhibition: {
          select: {
            createdBy: true,
          },
        },
      },
    })

    if (!document) {
      return apiError('文件不存在', 404)
    }

    // 權限檢查：超級管理員、展覽創建者、或上傳者本人
    if (
      user.role !== 'SUPER_ADMIN' &&
      document.exhibition.createdBy !== user.id &&
      document.uploadedBy !== user.id
    ) {
      return apiError('沒有權限刪除此文件', 403)
    }

    // 刪除文件記錄
    await prisma.document.delete({
      where: { id },
    })

    // 記錄審計日誌
    await createAuditLog({
      action: AuditAction.FILE_DELETE,
      userId: user.id,
      entityType: 'Document',
      entityId: id,
      metadata: {
        action: 'delete',
        title: document.title,
        fileUrl: document.fileUrl,
      },
    })

    return apiSuccess(null, '文件刪除成功')
  } catch (error) {
    return handleApiError(error)
  }
}
