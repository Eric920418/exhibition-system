import Redis from 'ioredis'
import { env } from '@/env'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

if (env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Redis 鍵值命名空間
export const RedisKeys = {
  // 即時叫號 (TTL: 1天)
  currentServing: (teamId: string) => `serving:${teamId}`,
  waitingQueue: (teamId: string, date: string) => `queue:${teamId}:${date}`,

  // 預約序號計數器 (TTL: 1天)
  reservationSequence: (teamId: string, date: string) => `reservation:sequence:${teamId}:${date}`,

  // Rate Limiting - 預約相關
  reservationRateLimit: (phone: string, date: string) => `reservation:limit:${phone}:${date}`,

  // Session (TTL: 7天)
  userSession: (userId: string) => `session:${userId}`,

  // API 限流 (TTL: 1小時)
  rateLimit: (ip: string, endpoint: string) => `limit:${ip}:${endpoint}`,

  // 熱門資料快取 (TTL: 5分鐘)
  exhibitionPublic: (exhibitionId: string) => `cache:exhibition:${exhibitionId}`,
  teamArtworks: (teamId: string) => `cache:artworks:${teamId}`,

  // WebSocket 連線 (TTL: 10分鐘)
  socketConnection: (socketId: string) => `socket:${socketId}`,
}