import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth, requireRole } from '@/lib/api-response'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * PATCH /api/admin/api-keys/[id]
 * 更新 API 金鑰設定
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)
    requireRole(user, ['SUPER_ADMIN'])

    const { id } = await params
    const body = await request.json()
    const { name, description, isActive, rateLimit, expiresAt } = body

    const existing = await prisma.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return apiError('找不到指定的 API 金鑰', 404)
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = String(name).trim()
    if (description !== undefined) updateData.description = description ? String(description).trim() : null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (rateLimit !== undefined && typeof rateLimit === 'number' && rateLimit > 0) {
      updateData.rateLimit = rateLimit
    }
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        isActive: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    })

    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.API_KEY_UPDATE,
      userId: user.id,
      entityType: 'ApiKey',
      entityId: id,
      metadata: updateData,
      ipAddress,
      userAgent,
    })

    return apiSuccess(apiKey, 'API 金鑰更新成功')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * 撤銷 API 金鑰（設 isActive: false）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const user = requireAuth(session)
    requireRole(user, ['SUPER_ADMIN'])

    const { id } = await params

    const existing = await prisma.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return apiError('找不到指定的 API 金鑰', 404)
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    })

    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.API_KEY_REVOKE,
      userId: user.id,
      entityType: 'ApiKey',
      entityId: id,
      metadata: { name: existing.name, keyPrefix: existing.keyPrefix },
      ipAddress,
      userAgent,
    })

    return apiSuccess(null, 'API 金鑰已撤銷')
  } catch (error) {
    return handleApiError(error)
  }
}
