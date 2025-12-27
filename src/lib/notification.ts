import { prisma } from './prisma'
import { NotificationType, Prisma } from '@prisma/client'

export { NotificationType }

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedType?: string
  relatedId?: string
  metadata?: Prisma.InputJsonValue
}

interface CreateBulkNotificationParams {
  userIds: string[]
  type: NotificationType
  title: string
  content: string
  relatedType?: string
  relatedId?: string
  metadata?: Prisma.InputJsonValue
}

/**
 * 創建單一通知
 */
export async function createNotification({
  userId,
  type,
  title,
  content,
  relatedType,
  relatedId,
  metadata,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      relatedType,
      relatedId,
      metadata,
    },
  })
}

/**
 * 批量創建通知（給多個用戶發送相同通知）
 */
export async function createBulkNotifications({
  userIds,
  type,
  title,
  content,
  relatedType,
  relatedId,
  metadata,
}: CreateBulkNotificationParams) {
  if (userIds.length === 0) return []

  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      content,
      relatedType,
      relatedId,
      metadata,
    })),
  })
}

/**
 * 卡片指派通知
 */
export async function notifyCardAssigned({
  cardId,
  cardTitle,
  assigneeIds,
  assignerName,
  boardName,
}: {
  cardId: string
  cardTitle: string
  assigneeIds: string[]
  assignerName: string
  boardName: string
}) {
  return createBulkNotifications({
    userIds: assigneeIds,
    type: NotificationType.CARD_ASSIGNED,
    title: '你被指派了新任務',
    content: `${assignerName} 將任務「${cardTitle}」指派給你（看板：${boardName}）`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, assignerName, boardName },
  })
}

/**
 * 卡片評論通知
 */
export async function notifyCardComment({
  cardId,
  cardTitle,
  commenterName,
  commentContent,
  recipientIds,
}: {
  cardId: string
  cardTitle: string
  commenterName: string
  commentContent: string
  recipientIds: string[]
}) {
  return createBulkNotifications({
    userIds: recipientIds,
    type: NotificationType.CARD_COMMENT,
    title: '任務有新評論',
    content: `${commenterName} 在任務「${cardTitle}」中評論：${commentContent.slice(0, 50)}${commentContent.length > 50 ? '...' : ''}`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, commenterName },
  })
}

/**
 * 卡片即將到期通知
 */
export async function notifyCardDueSoon({
  cardId,
  cardTitle,
  dueDate,
  assigneeIds,
}: {
  cardId: string
  cardTitle: string
  dueDate: Date
  assigneeIds: string[]
}) {
  const dueDateStr = dueDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return createBulkNotifications({
    userIds: assigneeIds,
    type: NotificationType.CARD_DUE_SOON,
    title: '任務即將到期',
    content: `任務「${cardTitle}」將於 ${dueDateStr} 到期`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, dueDate: dueDate.toISOString() },
  })
}

/**
 * 卡片已過期通知
 */
export async function notifyCardOverdue({
  cardId,
  cardTitle,
  dueDate,
  assigneeIds,
}: {
  cardId: string
  cardTitle: string
  dueDate: Date
  assigneeIds: string[]
}) {
  const dueDateStr = dueDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return createBulkNotifications({
    userIds: assigneeIds,
    type: NotificationType.CARD_OVERDUE,
    title: '任務已過期',
    content: `任務「${cardTitle}」已於 ${dueDateStr} 過期`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, dueDate: dueDate.toISOString() },
  })
}

/**
 * 卡片更新通知
 */
export async function notifyCardUpdated({
  cardId,
  cardTitle,
  updaterName,
  changes,
  recipientIds,
}: {
  cardId: string
  cardTitle: string
  updaterName: string
  changes: string
  recipientIds: string[]
}) {
  return createBulkNotifications({
    userIds: recipientIds,
    type: NotificationType.CARD_UPDATED,
    title: '任務已更新',
    content: `${updaterName} 更新了任務「${cardTitle}」：${changes}`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, updaterName, changes },
  })
}

/**
 * 子任務完成通知
 */
export async function notifySubtaskCompleted({
  cardId,
  cardTitle,
  subtaskTitle,
  completedByName,
  recipientIds,
}: {
  cardId: string
  cardTitle: string
  subtaskTitle: string
  completedByName: string
  recipientIds: string[]
}) {
  return createBulkNotifications({
    userIds: recipientIds,
    type: NotificationType.SUBTASK_COMPLETED,
    title: '子任務已完成',
    content: `${completedByName} 完成了任務「${cardTitle}」的子任務「${subtaskTitle}」`,
    relatedType: 'card',
    relatedId: cardId,
    metadata: { cardTitle, subtaskTitle, completedByName },
  })
}

/**
 * 取得用戶未讀通知數量
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })
}

/**
 * 取得用戶通知列表
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options
  const skip = (page - 1) * limit

  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * 標記所有通知為已讀
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * 刪除通知
 */
export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  })
}

/**
 * 清理舊通知（超過 30 天）
 */
export async function cleanupOldNotifications() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      isRead: true,
    },
  })
}
