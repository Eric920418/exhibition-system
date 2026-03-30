import { redis, RedisKeys } from './redis'
import { prisma } from './prisma'

/**
 * 檢查 Redis 是否可用
 */
async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}

/**
 * 生成預約序號（使用 Redis 原子操作避免並發問題，Redis 不可用時使用資料庫）
 */
export async function generateSequenceNumber(
  teamId: string,
  date: string
): Promise<number> {
  const redisAvailable = await isRedisAvailable()

  if (redisAvailable) {
    try {
      const key = RedisKeys.reservationSequence(teamId, date)
      const sequenceNumber = await redis.incr(key)
      await redis.expire(key, 172800)
      return sequenceNumber
    } catch (error) {
      console.warn('Redis sequence generation failed, falling back to database:', error)
    }
  }

  // 資料庫備援：查詢當日最大序號 + 1
  const dateObj = new Date(date + 'T00:00:00.000Z')
  const maxReservation = await prisma.reservation.findFirst({
    where: {
      teamId,
      reservationDate: dateObj,
    },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  })

  return (maxReservation?.sequenceNumber ?? 0) + 1
}

/**
 * 獲取當前序號（不增加）
 */
export async function getCurrentSequenceNumber(
  teamId: string,
  date: string
): Promise<number> {
  const redisAvailable = await isRedisAvailable()

  if (redisAvailable) {
    try {
      const key = RedisKeys.reservationSequence(teamId, date)
      const current = await redis.get<number>(key)
      if (current !== null && current !== undefined) return current
    } catch (error) {
      console.warn('Redis getCurrentSequenceNumber failed:', error)
    }
  }

  // 資料庫備援
  const dateObj = new Date(date + 'T00:00:00.000Z')
  const maxReservation = await prisma.reservation.findFirst({
    where: { teamId, reservationDate: dateObj },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  })

  return maxReservation?.sequenceNumber ?? 0
}

/**
 * 計算預估等候時間（分鐘）
 */
export async function calculateEstimatedWaitTime(
  teamId: string,
  queuePosition: number
): Promise<number> {
  // 獲取預約設定
  const config = await prisma.reservationConfig.findUnique({
    where: { teamId },
    select: {
      slotDurationMinutes: true,
      breakDurationMinutes: true,
      maxConcurrentCapacity: true,
    },
  })

  if (!config) {
    return 0
  }

  const serviceTimePerPerson = config.slotDurationMinutes + config.breakDurationMinutes
  const effectivePosition = Math.max(0, queuePosition - 1) // 扣除自己

  // 計算等候時間 = (前面的人數 / 並發容量) * 每人服務時間
  const waitTime = Math.ceil(
    (effectivePosition / config.maxConcurrentCapacity) * serviceTimePerPerson
  )

  return waitTime
}

/**
 * 獲取隊列中的位置
 */
export async function getQueuePosition(
  teamId: string,
  date: Date,
  sequenceNumber: number
): Promise<number> {
  // 計算在自己之前有多少等待中的人
  const waitingBefore = await prisma.reservation.count({
    where: {
      teamId,
      reservationDate: date,
      sequenceNumber: { lt: sequenceNumber },
      status: 'WAITING',
    },
  })

  return waitingBefore + 1
}

/**
 * 獲取隊列統計資訊
 */
export async function getQueueStats(teamId: string, date: Date) {
  const groups = await prisma.reservation.groupBy({
    by: ['status'],
    where: { teamId, reservationDate: date },
    _count: true,
  })

  const countByStatus = (status: string) =>
    groups.find((g) => g.status === status)?._count ?? 0

  const waiting = countByStatus('WAITING')
  const called = countByStatus('CALLED')
  const inProgress = countByStatus('IN_PROGRESS')
  const completed = countByStatus('COMPLETED')
  const cancelled = countByStatus('CANCELLED')
  const noShow = countByStatus('NO_SHOW')

  return {
    waiting,
    called,
    inProgress,
    completed,
    cancelled,
    noShow,
    total: waiting + called + inProgress + completed + cancelled + noShow,
  }
}

/**
 * 檢查手機號碼的每日預約限制
 */
export async function checkPhoneRateLimit(
  phone: string,
  date: string,
  maxPerDay: number = 3
): Promise<{ allowed: boolean; current: number }> {
  const redisAvailable = await isRedisAvailable()

  if (redisAvailable) {
    try {
      const key = RedisKeys.reservationRateLimit(phone, date)
      const current = await redis.get<number>(key)
      const count = current ?? 0

      if (count >= maxPerDay) {
        return { allowed: false, current: count }
      }

      return { allowed: true, current: count }
    } catch (error) {
      console.warn('Redis rate limit check failed:', error)
    }
  }

  // 資料庫備援：查詢當日該手機的預約數
  const dateObj = new Date(date + 'T00:00:00.000Z')
  const count = await prisma.reservation.count({
    where: {
      visitorPhone: phone,
      reservationDate: dateObj,
      status: { notIn: ['CANCELLED'] },
    },
  })

  return {
    allowed: count < maxPerDay,
    current: count,
  }
}

/**
 * 增加手機號碼的預約計數
 */
export async function incrementPhoneRateLimit(
  phone: string,
  date: string
): Promise<number> {
  const redisAvailable = await isRedisAvailable()

  if (redisAvailable) {
    try {
      const key = RedisKeys.reservationRateLimit(phone, date)
      const count = await redis.incr(key)
      await redis.expire(key, 172800)
      return count
    } catch (error) {
      console.warn('Redis rate limit increment failed:', error)
    }
  }

  // 資料庫備援：返回當前計數（實際限制已在 checkPhoneRateLimit 中處理）
  const dateObj = new Date(date + 'T00:00:00.000Z')
  const count = await prisma.reservation.count({
    where: {
      visitorPhone: phone,
      reservationDate: dateObj,
      status: { notIn: ['CANCELLED'] },
    },
  })

  return count
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 解析日期字串為 Date（設定為當天 00:00:00 UTC）
 */
export function parseDateString(dateString: string): Date {
  const date = new Date(dateString + 'T00:00:00.000Z')
  return date
}

/**
 * 獲取當前服務狀態
 */
export async function getCurrentServingStatus(teamId: string) {
  const serving = await prisma.currentServing.findUnique({
    where: { teamId },
    include: {
      reservation: {
        select: {
          id: true,
          sequenceNumber: true,
          visitorName: true,
          status: true,
          calledAt: true,
        },
      },
    },
  })

  return serving
}

/**
 * 獲取下一位等待中的預約
 */
export async function getNextWaitingReservation(teamId: string, date: Date) {
  return prisma.reservation.findFirst({
    where: {
      teamId,
      reservationDate: date,
      status: 'WAITING',
    },
    orderBy: { sequenceNumber: 'asc' },
  })
}
