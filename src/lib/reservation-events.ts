import { redis } from './redis'

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
 * Redis Pub/Sub 頻道名稱
 */
export const ReservationChannels = {
  // 組別叫號更新頻道（大螢幕、工作人員訂閱）
  teamServing: (teamId: string) => `reservation:serving:${teamId}`,

  // 全域叫號更新（多組別大螢幕訂閱）
  globalServing: () => 'reservation:serving:global',
}

/**
 * 發布預約事件
 */
export async function publishReservationEvent(event: ReservationEvent): Promise<void> {
  const redisAvailable = await isRedisAvailable()
  if (!redisAvailable) {
    console.warn('Redis not available, skipping event publish')
    return
  }

  try {
    const message = JSON.stringify(event)

    // 發布到組別頻道
    await redis.publish(ReservationChannels.teamServing(event.teamId), message)

    // 同時發布到全域頻道
    await redis.publish(ReservationChannels.globalServing(), message)
  } catch (error) {
    console.warn('Failed to publish reservation event:', error)
  }
}

/**
 * 創建 SSE 訂閱者
 * @param teamId 組別 ID（可選，不傳則訂閱全域）
 * @param onMessage 訊息回調
 * @returns 取消訂閱函數
 */
export async function createSSESubscriber(
  teamId: string | null,
  onMessage: (event: ReservationEvent) => void
): Promise<() => void> {
  // 創建獨立的 Redis 連接用於訂閱
  const subscriber = redis.duplicate()

  const channel = teamId
    ? ReservationChannels.teamServing(teamId)
    : ReservationChannels.globalServing()

  await subscriber.subscribe(channel)

  subscriber.on('message', (ch, message) => {
    try {
      const event = JSON.parse(message) as ReservationEvent
      onMessage(event)
    } catch (error) {
      console.error('Failed to parse reservation event:', error)
    }
  })

  // 返回取消訂閱函數
  return async () => {
    await subscriber.unsubscribe(channel)
    await subscriber.quit()
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
