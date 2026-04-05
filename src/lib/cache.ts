/**
 * 快取工具函數
 * 提供 Redis 快取操作的統一介面
 */

import { redis, RedisKeys } from './redis'

/**
 * 快取配置
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 分鐘
  MEDIUM: 300, // 5 分鐘
  LONG: 3600, // 1 小時
  DAY: 86400, // 1 天
} as const

/**
 * 通用快取獲取函數
 * 實現 cache-aside 模式
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    // 嘗試從快取獲取
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }

    // 快取未命中，執行 fetcher
    const data = await fetcher()

    // 存入快取
    await redis.set(key, data, { ex: ttlSeconds })

    return data
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error)
    // 快取失敗時直接返回 fetcher 結果
    return fetcher()
  }
}

/**
 * 刪除快取
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Cache invalidation error for key ${key}:`, error)
  }
}

/**
 * 批量刪除快取（使用 SCAN 迭代）
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = 0
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = Number(result[0])
      const keys = result[1] as string[]
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== 0)
  } catch (error) {
    console.error(`Cache pattern invalidation error for ${pattern}:`, error)
  }
}

/**
 * 展覽快取鍵
 */
export function exhibitionCacheKey(id: string): string {
  return RedisKeys.exhibitionPublic(id)
}

/**
 * 作品列表快取鍵
 */
export function artworksCacheKey(teamId: string): string {
  return RedisKeys.teamArtworks(teamId)
}

/**
 * 快取展覽資料
 */
export async function cacheExhibition<T>(
  id: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return getOrSet(exhibitionCacheKey(id), fetcher, CACHE_TTL.MEDIUM)
}

/**
 * 快取作品列表
 */
export async function cacheArtworks<T>(
  teamId: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return getOrSet(artworksCacheKey(teamId), fetcher, CACHE_TTL.MEDIUM)
}

/**
 * 刪除展覽快取
 */
export async function invalidateExhibitionCache(id: string): Promise<void> {
  await invalidateCache(exhibitionCacheKey(id))
}

/**
 * 刪除團隊相關的所有快取
 */
export async function invalidateTeamCache(teamId: string): Promise<void> {
  await invalidateCachePattern(`cache:artworks:${teamId}*`)
}

/**
 * Admin dashboard stats 快取鍵
 */
export function adminDashboardStatsKey(userId: string): string {
  return RedisKeys.adminDashboardStats(userId)
}

/**
 * Admin dashboard recent items 快取鍵
 */
export function adminDashboardRecentKey(userId: string): string {
  return RedisKeys.adminDashboardRecent(userId)
}

/**
 * Admin 展覽下拉選單快取鍵
 */
export function adminExhibitionDropdownKey(): string {
  return RedisKeys.adminExhibitionDropdown()
}

/**
 * 清除所有 Admin dashboard 快取（所有使用者）
 */
export async function invalidateAdminDashboard(): Promise<void> {
  await invalidateCachePattern('cache:admin:dashboard:*')
}

/**
 * 清除 Admin 下拉選單快取
 */
export async function invalidateAdminDropdowns(): Promise<void> {
  await invalidateCache(adminExhibitionDropdownKey())
}

/**
 * 檢查 Redis 連線狀態
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}

/**
 * 取得快取統計資訊
 */
export async function getCacheStats(): Promise<{
  connected: boolean
  memoryUsage: string
  keyCount: number
}> {
  try {
    await redis.ping()
    return {
      connected: true,
      memoryUsage: 'N/A',
      keyCount: 0,
    }
  } catch {
    return {
      connected: false,
      memoryUsage: 'N/A',
      keyCount: 0,
    }
  }
}
