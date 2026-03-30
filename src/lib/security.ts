/**
 * 安全性工具函數
 * 提供常見的安全檢查和防護功能
 */

import { redis, RedisKeys } from './redis'

/**
 * XSS 防護 - 清理 HTML 輸入
 * 移除潛在的惡意腳本標籤和屬性
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  return input
    // 移除 script 標籤
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // 移除 on* 事件屬性
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // 移除 javascript: URL
    .replace(/javascript:/gi, '')
    // 移除 data: URL (除了安全的圖片)
    .replace(/data:(?!image\/(png|jpeg|gif|webp))[^,]*,/gi, '')
}

/**
 * SQL 注入防護 - 驗證輸入是否為安全的識別符
 */
export function isSafeIdentifier(input: string): boolean {
  // 只允許字母、數字、底線和連字符
  return /^[a-zA-Z0-9_-]+$/.test(input)
}

/**
 * Rate Limiting - 使用 Redis 實現
 * @param key - 唯一識別鍵 (例如 IP + endpoint)
 * @param limit - 允許的請求次數
 * @param windowMs - 時間窗口 (毫秒)
 * @returns 是否允許請求
 */
export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const now = Date.now()
  const windowStart = now - windowMs
  const redisKey = `ratelimit:${key}`

  try {
    // 使用 Redis sorted set 來追蹤請求
    await redis.zremrangebyscore(redisKey, 0, windowStart)
    const count = await redis.zcard(redisKey)

    if (count >= limit) {
      const oldestRequest = await redis.zrange<string[]>(redisKey, 0, 0, { withScores: true })
      const resetTime = oldestRequest.length > 1
        ? parseInt(oldestRequest[1]) + windowMs
        : now + windowMs

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      }
    }

    await redis.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` })
    await redis.expire(redisKey, Math.ceil(windowMs / 1000))

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: now + windowMs,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // 失敗時允許請求，避免影響正常使用
    return {
      allowed: true,
      remaining: limit,
      resetTime: now + windowMs,
    }
  }
}

/**
 * 密碼強度檢查
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('密碼至少需要 8 個字元')

  if (password.length >= 12) score += 1

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('建議包含小寫字母')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('建議包含大寫字母')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('建議包含數字')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('建議包含特殊字元')

  // 檢查常見弱密碼模式
  const weakPatterns = ['123456', 'password', 'qwerty', 'abc123']
  if (weakPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2)
    feedback.push('避免使用常見密碼模式')
  }

  return { score, feedback }
}

/**
 * CSRF Token 生成
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Node.js 環境
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 驗證 UUID 格式
 */
export function isValidUUID(input: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(input)
}

/**
 * 驗證電子郵件格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * 敏感資料遮罩
 */
export function maskSensitiveData(data: string, visibleStart = 2, visibleEnd = 2): string {
  if (data.length <= visibleStart + visibleEnd) {
    return '*'.repeat(data.length)
  }
  const start = data.slice(0, visibleStart)
  const end = data.slice(-visibleEnd)
  const masked = '*'.repeat(Math.max(1, data.length - visibleStart - visibleEnd))
  return `${start}${masked}${end}`
}

/**
 * 驗證檔案類型
 */
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  video: ['video/mp4', 'video/webm'],
} as const

export function isAllowedFileType(mimeType: string, category: keyof typeof ALLOWED_FILE_TYPES): boolean {
  const allowedTypes: readonly string[] = ALLOWED_FILE_TYPES[category]
  return allowedTypes.includes(mimeType)
}

/**
 * 檔案大小限制 (bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
} as const
