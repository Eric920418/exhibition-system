import { Redis } from '@upstash/redis'

function createRedisClient(): Redis {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    // 回傳一個代理物件，在實際呼叫時才拋錯（避免 build 時 crash）
    return new Proxy({} as Redis, {
      get(_, prop) {
        if (prop === 'ping') {
          return async () => { throw new Error('Redis not configured') }
        }
        return async () => { throw new Error('Redis not configured: KV_REST_API_URL or KV_REST_API_TOKEN missing') }
      },
    })
  }

  return new Redis({ url, token })
}

export const redis = createRedisClient()

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

  // Admin 後台快取 (TTL: 60s - 300s)
  adminDashboardStats: (userId: string) => `cache:admin:dashboard:stats:${userId}`,
  adminDashboardRecent: (userId: string) => `cache:admin:dashboard:recent:${userId}`,
  adminExhibitionDropdown: () => `cache:admin:dropdown:exhibitions`,

  // SSE 事件列表 (TTL: 1天)
  sseEvents: (channel: string) => `sse:events:${channel}`,
  sseEventCounter: (channel: string) => `sse:counter:${channel}`,
}
