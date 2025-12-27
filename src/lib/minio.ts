import * as Minio from 'minio'
import { env } from '@/env'

/**
 * MinIO 客戶端配置
 * 如果環境變數未設置，則返回 null（可選功能）
 */
export const minioClient = env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY
  ? new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT ? parseInt(env.MINIO_PORT) : 9000,
      useSSL: env.MINIO_USE_SSL === 'true',
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    })
  : null

/**
 * 預設 Bucket 名稱
 */
export const DEFAULT_BUCKET = env.MINIO_BUCKET_NAME || 'exhibition-bucket'

/**
 * 檔案類型限制
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}

/**
 * 檔案大小限制（bytes）
 */
export const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 20 * 1024 * 1024, // 20MB
}

/**
 * 初始化 MinIO Bucket
 */
export async function initMinIOBucket() {
  if (!minioClient) {
    console.warn('MinIO 未配置，跳過 Bucket 初始化')
    return false
  }

  try {
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET)

    if (!bucketExists) {
      await minioClient.makeBucket(DEFAULT_BUCKET, 'us-east-1')
      console.log(`✅ MinIO Bucket "${DEFAULT_BUCKET}" 創建成功`)

      // 設置 Bucket 為公開讀取（可選）
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DEFAULT_BUCKET}/*`],
          },
        ],
      }

      await minioClient.setBucketPolicy(
        DEFAULT_BUCKET,
        JSON.stringify(policy)
      )
      console.log(`✅ MinIO Bucket 策略設置成功`)
    } else {
      console.log(`✅ MinIO Bucket "${DEFAULT_BUCKET}" 已存在`)
    }

    return true
  } catch (error) {
    console.error('❌ MinIO Bucket 初始化失敗:', error)
    return false
  }
}

/**
 * 生成唯一檔案名稱
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const sanitizedName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 50)

  return `${sanitizedName}-${timestamp}-${random}.${extension}`
}

/**
 * 獲取檔案類型分類
 */
export function getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'other' {
  if (ALLOWED_FILE_TYPES.images.includes(mimeType)) return 'image'
  if (ALLOWED_FILE_TYPES.videos.includes(mimeType)) return 'video'
  if (ALLOWED_FILE_TYPES.documents.includes(mimeType)) return 'document'
  return 'other'
}

/**
 * 驗證檔案類型
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType)
}

/**
 * 驗證檔案大小
 */
export function validateFileSize(size: number, category: 'image' | 'video' | 'document'): boolean {
  return size <= MAX_FILE_SIZE[category]
}

/**
 * 上傳檔案到 MinIO
 */
export async function uploadFile(
  file: Buffer | ReadableStream,
  fileName: string,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!minioClient) {
    throw new Error('MinIO 未配置')
  }

  try {
    const metaData = {
      'Content-Type': mimeType,
      ...metadata,
    }

    // 如果是 Buffer，需要提供 size
    if (Buffer.isBuffer(file)) {
      await minioClient.putObject(
        DEFAULT_BUCKET,
        fileName,
        file,
        file.length,
        metaData
      )
    } else {
      // ReadableStream 的情況
      await minioClient.putObject(
        DEFAULT_BUCKET,
        fileName,
        file as any,
        metaData as any
      )
    }

    // 返回檔案 URL
    return `${env.MINIO_ENDPOINT}:${env.MINIO_PORT || 9000}/${DEFAULT_BUCKET}/${fileName}`
  } catch (error) {
    console.error('檔案上傳失敗:', error)
    throw new Error('檔案上傳失敗')
  }
}

/**
 * 刪除檔案
 */
export async function deleteFile(fileName: string): Promise<void> {
  if (!minioClient) {
    throw new Error('MinIO 未配置')
  }

  try {
    await minioClient.removeObject(DEFAULT_BUCKET, fileName)
  } catch (error) {
    console.error('檔案刪除失敗:', error)
    throw new Error('檔案刪除失敗')
  }
}

/**
 * 獲取檔案下載 URL（有效期 7 天）
 */
export async function getPresignedUrl(fileName: string, expirySeconds = 7 * 24 * 60 * 60): Promise<string> {
  if (!minioClient) {
    throw new Error('MinIO 未配置')
  }

  try {
    return await minioClient.presignedGetObject(DEFAULT_BUCKET, fileName, expirySeconds)
  } catch (error) {
    console.error('生成預簽名 URL 失敗:', error)
    throw new Error('生成下載連結失敗')
  }
}
