import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'
import { checkRateLimit } from './security'

/**
 * 產生新的 API Key
 * 格式：exhb_<64 hex chars>
 */
export function generateApiKey(): {
  rawKey: string
  keyHash: string
  keyPrefix: string
} {
  const raw = randomBytes(32).toString('hex') // 64 hex chars
  const rawKey = `exhb_${raw}`
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 8) // "exhb_xxx" first 8 chars

  return { rawKey, keyHash, keyPrefix }
}

/**
 * SHA-256 hash an API key
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/**
 * 從 Request header 驗證 API Key
 * 讀取 X-API-Key header，hash 後查 DB，檢查 isActive 與 expiresAt
 */
export async function validateApiKey(request: Request) {
  const rawKey = request.headers.get('X-API-Key')

  if (!rawKey) {
    throw new Error('缺少 X-API-Key header')
  }

  const keyHash = hashApiKey(rawKey)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      isActive: true,
      rateLimit: true,
      expiresAt: true,
    },
  })

  if (!apiKey) {
    throw new Error('無效的 API Key')
  }

  if (!apiKey.isActive) {
    throw new Error('API Key 已停用')
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw new Error('API Key 已過期')
  }

  // fire-and-forget update lastUsedAt
  prisma.apiKey.update({
    where: { keyHash },
    data: { lastUsedAt: new Date() },
  }).catch(() => {
    // ignore errors, this is best-effort
  })

  return apiKey
}

/**
 * 針對 API Key 進行速率限制檢查
 */
export async function checkApiKeyRateLimit(
  keyPrefix: string,
  limit: number,
  windowMs = 60000
) {
  return checkRateLimit(`apikey:${keyPrefix}`, limit, windowMs)
}
