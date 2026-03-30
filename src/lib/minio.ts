import { put, del } from '@vercel/blob'

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
 * 上傳檔案到 Vercel Blob
 */
export async function uploadFile(
  file: Buffer | File | ReadableStream,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const blob = await put(fileName, file, {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: false,
  })

  return blob.url
}

/**
 * 刪除檔案
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    await del(fileUrl)
  } catch (error) {
    console.error('檔案刪除失敗:', error)
    throw new Error('檔案刪除失敗')
  }
}

/**
 * 獲取檔案 URL（Vercel Blob URL 直接可存取）
 */
export async function getPresignedUrl(fileUrl: string): Promise<string> {
  return fileUrl
}
