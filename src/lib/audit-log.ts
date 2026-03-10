import { prisma } from './prisma'

/**
 * 審計日誌動作類型
 */
export enum AuditAction {
  // 用戶操作
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // 展覽操作
  EXHIBITION_CREATE = 'EXHIBITION_CREATE',
  EXHIBITION_UPDATE = 'EXHIBITION_UPDATE',
  EXHIBITION_DELETE = 'EXHIBITION_DELETE',
  EXHIBITION_PUBLISH = 'EXHIBITION_PUBLISH',

  // 作品操作
  ARTWORK_CREATE = 'ARTWORK_CREATE',
  ARTWORK_UPDATE = 'ARTWORK_UPDATE',
  ARTWORK_DELETE = 'ARTWORK_DELETE',
  ARTWORK_APPROVE = 'ARTWORK_APPROVE',
  ARTWORK_REJECT = 'ARTWORK_REJECT',

  // 團隊操作
  TEAM_CREATE = 'TEAM_CREATE',
  TEAM_UPDATE = 'TEAM_UPDATE',
  TEAM_DELETE = 'TEAM_DELETE',
  TEAM_MEMBER_ADD = 'TEAM_MEMBER_ADD',
  TEAM_MEMBER_UPDATE = 'TEAM_MEMBER_UPDATE',
  TEAM_MEMBER_REMOVE = 'TEAM_MEMBER_REMOVE',

  // 看板操作
  BOARD_CREATE = 'BOARD_CREATE',
  BOARD_UPDATE = 'BOARD_UPDATE',
  BOARD_DELETE = 'BOARD_DELETE',
  LIST_CREATE = 'LIST_CREATE',
  LIST_UPDATE = 'LIST_UPDATE',
  LIST_DELETE = 'LIST_DELETE',
  CARD_CREATE = 'CARD_CREATE',
  CARD_UPDATE = 'CARD_UPDATE',
  CARD_DELETE = 'CARD_DELETE',
  CARD_MOVE = 'CARD_MOVE',

  // 檔案操作
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',

  // 預約設定操作
  RESERVATION_CONFIG_CREATE = 'RESERVATION_CONFIG_CREATE',
  RESERVATION_CONFIG_UPDATE = 'RESERVATION_CONFIG_UPDATE',
  RESERVATION_CONFIG_DELETE = 'RESERVATION_CONFIG_DELETE',

  // 預約記錄操作
  RESERVATION_CREATE = 'RESERVATION_CREATE',
  RESERVATION_UPDATE = 'RESERVATION_UPDATE',
  RESERVATION_CANCEL = 'RESERVATION_CANCEL',

  // 叫號操作
  RESERVATION_CALL_NEXT = 'RESERVATION_CALL_NEXT',
  RESERVATION_CALL_SPECIFIC = 'RESERVATION_CALL_SPECIFIC',
  RESERVATION_COMPLETE = 'RESERVATION_COMPLETE',
  RESERVATION_NO_SHOW = 'RESERVATION_NO_SHOW',
  RESERVATION_REQUEUE = 'RESERVATION_REQUEUE',

  // 預約管理操作
  RESERVATION_DAILY_RESET = 'RESERVATION_DAILY_RESET',
  RESERVATION_BATCH_CLEANUP = 'RESERVATION_BATCH_CLEANUP',

  // 系統操作
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',

  // API 金鑰操作
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_REVOKE = 'API_KEY_REVOKE',
  API_KEY_UPDATE = 'API_KEY_UPDATE',

  // 其他操作
  OTHER = 'OTHER',
}

/**
 * 審計日誌參數
 */
export interface AuditLogParams {
  action: AuditAction | string
  userId?: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * 創建審計日誌
 */
export async function createAuditLog({
  action,
  userId,
  entityType,
  entityId,
  metadata,
  ipAddress,
  userAgent,
}: AuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        performedBy: userId,
        entityType: entityType || '',
        entityId: entityId || '',
        changes: metadata,
        ipAddress,
        userAgent,
      },
    })

    return auditLog
  } catch (error) {
    // 審計日誌失敗不應阻擋主要操作
    console.error('❌ 審計日誌創建失敗:', error)
    return null
  }
}

/**
 * 批量創建審計日誌
 */
export async function createAuditLogs(logs: AuditLogParams[]) {
  try {
    const auditLogs = await prisma.auditLog.createMany({
      data: logs.map(log => ({
        action: log.action,
        performedBy: log.userId,
        entityType: log.entityType || '',
        entityId: log.entityId || '',
        changes: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })),
    })

    return auditLogs
  } catch (error) {
    console.error('❌ 批量審計日誌創建失敗:', error)
    return null
  }
}

/**
 * 從 Request 提取 IP 和 User Agent
 */
export function extractRequestInfo(request: Request) {
  // 嘗試從多個 header 獲取真實 IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ipAddress =
    cfConnectingIp ||
    realIp ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    'unknown'

  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}

/**
 * 審計日誌裝飾器（用於 API 路由）
 */
export function withAuditLog(
  action: AuditAction | string,
  getEntityInfo?: (params: any) => { entityType?: string; entityId?: string; metadata?: any }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)

      // 在操作完成後記錄審計日誌
      const request = args[0] // 假設第一個參數是 Request
      if (request && typeof request === 'object' && 'headers' in request) {
        const { ipAddress, userAgent } = extractRequestInfo(request)

        const entityInfo = getEntityInfo ? getEntityInfo(result) : {}

        await createAuditLog({
          action,
          ipAddress,
          userAgent,
          ...entityInfo,
        })
      }

      return result
    }

    return descriptor
  }
}

/**
 * 查詢審計日誌
 */
export async function getAuditLogs({
  userId,
  entityType,
  entityId,
  action,
  startDate,
  endDate,
  page = 1,
  limit = 50,
}: {
  userId?: string
  entityType?: string
  entityId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const where: any = {}

  if (userId) where.userId = userId
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (action) where.action = action

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const skip = (page - 1) * limit

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { performedAt: 'desc' },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ])

  return {
    logs: logs.map(log => ({
      ...log,
      changes: log.changes,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 刪除舊的審計日誌（超過指定天數）
 */
export async function cleanupOldAuditLogs(daysToKeep = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        performedAt: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`🗑️  已清理 ${result.count} 條超過 ${daysToKeep} 天的審計日誌`)
    return result.count
  } catch (error) {
    console.error('❌ 審計日誌清理失敗:', error)
    return 0
  }
}
