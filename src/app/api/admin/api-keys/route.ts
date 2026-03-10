import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth, requireRole } from '@/lib/api-response'
import { generateApiKey } from '@/lib/api-key'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/admin/api-keys
 * 列出所有 API 金鑰（不含 keyHash）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)
    requireRole(user, ['SUPER_ADMIN'])

    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        isActive: true,
        rateLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    return apiSuccess({ apiKeys })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/api-keys
 * 建立新 API 金鑰，回傳 rawKey（唯一一次）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)
    requireRole(user, ['SUPER_ADMIN'])

    const body = await request.json()
    const { name, description, rateLimit, expiresAt } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiError('金鑰名稱為必填欄位', 400)
    }

    const { rawKey, keyHash, keyPrefix } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        keyPrefix,
        name: name.trim(),
        description: description?.trim() || null,
        rateLimit: typeof rateLimit === 'number' && rateLimit > 0 ? rateLimit : 100,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.id,
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        isActive: true,
        rateLimit: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.API_KEY_CREATE,
      userId: user.id,
      entityType: 'ApiKey',
      entityId: apiKey.id,
      metadata: { name: apiKey.name, keyPrefix: apiKey.keyPrefix },
      ipAddress,
      userAgent,
    })

    return apiSuccess({ apiKey, rawKey }, 'API 金鑰建立成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
