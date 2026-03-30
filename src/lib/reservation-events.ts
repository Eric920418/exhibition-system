import { redis, RedisKeys } from './redis'

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
 * 預約事件類型
 */
export type ReservationEventType =
  | 'SERVING_UPDATE'    // 當前服務更新
  | 'QUEUE_UPDATE'      // 隊列變更
  | 'RESERVATION_CALLED' // 預約被叫號
  | 'RESERVATION_COMPLETED' // 預約完成
  | 'RESERVATION_NO_SHOW'   // 預約未到

/**
 * 預約事件資料
 */
export interface ReservationEvent {
  type: ReservationEventType
  teamId: string
  data: {
    currentSequenceNumber?: number
    reservationId?: string
    sequenceNumber?: number
    visitorName?: string
    queueWaiting?: number
    timestamp: string
  }
}

/**
 * Redis 頻道名稱（用於事件列表）
 */
export const ReservationChannels = {
  // 組別叫號更新頻道（大螢幕、工作人員訂閱）
  teamServing: (teamId: string) => `reservation:serving:${teamId}`,

  // 全域叫號更新（多組別大螢幕訂閱）
  globalServing: () => 'reservation:serving:global',
}

/**
 * 發布預約事件（使用 Redis List 代替 Pub/Sub）
 * Upstash 不支援持久 TCP 連線的 Pub/Sub，改用 List + Counter 模式
 */
export async function publishReservationEvent(event: ReservationEvent): Promise<void> {
  const redisAvailable = await isRedisAvailable()
  if (!redisAvailable) {
    console.warn('Redis not available, skipping event publish')
    return
  }

  try {
    const message = JSON.stringify(event)
    const teamChannel = ReservationChannels.teamServing(event.teamId)
    const globalChannel = ReservationChannels.globalServing()

    const teamListKey = RedisKeys.sseEvents(teamChannel)
    const globalListKey = RedisKeys.sseEvents(globalChannel)
    const teamCounterKey = RedisKeys.sseEventCounter(teamChannel)
    const globalCounterKey = RedisKeys.sseEventCounter(globalChannel)

    // 使用 pipeline 一次送出所有命令
    const pipe = redis.pipeline()

    // 推入事件到組別列表
    pipe.lpush(teamListKey, message)
    pipe.ltrim(teamListKey, 0, 99) // 保留最近 100 筆
    pipe.expire(teamListKey, 86400)
    pipe.incr(teamCounterKey)
    pipe.expire(teamCounterKey, 86400)

    // 推入事件到全域列表
    pipe.lpush(globalListKey, message)
    pipe.ltrim(globalListKey, 0, 99)
    pipe.expire(globalListKey, 86400)
    pipe.incr(globalCounterKey)
    pipe.expire(globalCounterKey, 86400)

    await pipe.exec()
  } catch (error) {
    console.warn('Failed to publish reservation event:', error)
  }
}

/**
 * 輪詢新事件
 * @param channel 頻道名稱
 * @param lastCounter 上次讀取時的 counter 值
 * @returns 新事件列表和最新 counter 值
 */
export async function pollEvents(
  channel: string,
  lastCounter: number
): Promise<{ events: ReservationEvent[]; counter: number }> {
  try {
    const counterKey = RedisKeys.sseEventCounter(channel)
    const listKey = RedisKeys.sseEvents(channel)

    const currentCounter = await redis.get<number>(counterKey) ?? 0

    if (currentCounter === lastCounter) {
      return { events: [], counter: currentCounter }
    }

    // 計算需要讀取的事件數量
    const newEventCount = currentCounter - lastCounter
    const fetchCount = Math.min(newEventCount, 50) // 最多一次取 50 筆

    const rawEvents = await redis.lrange(listKey, 0, fetchCount - 1)

    const events: ReservationEvent[] = rawEvents
      .map((raw) => {
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {
          return null
        }
      })
      .filter((e): e is ReservationEvent => e !== null)
      .reverse() // 最舊的在前

    return { events, counter: currentCounter }
  } catch (error) {
    console.warn('Failed to poll events:', error)
    return { events: [], counter: lastCounter }
  }
}

/**
 * 發送叫號更新事件
 */
export async function emitServingUpdate(
  teamId: string,
  currentSequenceNumber: number,
  reservationId?: string,
  visitorName?: string,
  queueWaiting?: number
): Promise<void> {
  await publishReservationEvent({
    type: 'SERVING_UPDATE',
    teamId,
    data: {
      currentSequenceNumber,
      reservationId,
      visitorName: visitorName ? maskName(visitorName) : undefined,
      queueWaiting,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * 發送隊列更新事件
 */
export async function emitQueueUpdate(
  teamId: string,
  queueWaiting: number
): Promise<void> {
  await publishReservationEvent({
    type: 'QUEUE_UPDATE',
    teamId,
    data: {
      queueWaiting,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * 遮蔽姓名
 */
function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}
