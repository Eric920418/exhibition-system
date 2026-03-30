import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { generateUniqueFileName, getFileCategory, validateFileSize, uploadFile } from '@/lib/minio'

export const maxDuration = 60

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}

/**
 * POST /api/upload
 * 上傳檔案（儲存至 Vercel Blob）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 解析 FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'image' | 'video' | 'document'
    const relatedId = formData.get('relatedId') as string | null
    const relatedType = formData.get('relatedType') as string | null

    if (!file) {
      return apiError('請選擇要上傳的檔案', 400)
    }

    if (!type || !['image', 'video', 'document'].includes(type)) {
      return apiError('無效的檔案類型', 400)
    }

    const allowedTypes = ALLOWED_FILE_TYPES[type]
    if (!allowedTypes || !allowedTypes.includes(file.type)) {
      return apiError(`不支持的${type === 'image' ? '圖片' : type === 'video' ? '影片' : '文件'}格式`, 400)
    }

    if (!validateFileSize(file.size, type as 'image' | 'video' | 'document')) {
      const limits = { image: '10MB', video: '500MB', document: '20MB' }
      return apiError(`檔案大小超過限制（${limits[type as keyof typeof limits]}）`, 400)
    }

    // 生成唯一檔案名並上傳至 Vercel Blob
    const fileName = generateUniqueFileName(file.name)
    const subDir = `${type}s` // images/ videos/ documents/
    const blobPath = `uploads/${subDir}/${fileName}`

    const fileUrl = await uploadFile(file, blobPath, file.type)
    const fileCategory = getFileCategory(file.type)

    // 記錄到資料庫（如果有關聯 ID）
    let documentRecord = null
    if (relatedId && relatedType) {
      const documentData: any = {
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: user.id,
      }

      switch (relatedType) {
        case 'exhibition':
          documentData.exhibitionId = relatedId
          break
        case 'artwork': {
          const artwork = await prisma.artwork.findUnique({
            where: { id: relatedId },
            select: { team: { select: { exhibitionId: true } } },
          })
          if (artwork) documentData.exhibitionId = artwork.team.exhibitionId
          break
        }
        case 'team': {
          const team = await prisma.team.findUnique({
            where: { id: relatedId },
            select: { exhibitionId: true },
          })
          if (team) documentData.exhibitionId = team.exhibitionId
          break
        }
      }

      documentRecord = await prisma.document.create({ data: documentData })
    }

    return apiSuccess(
      {
        fileName,
        filePath: blobPath,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        category: fileCategory,
        document: documentRecord,
      },
      '檔案上傳成功',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/upload?fileName=xxx
 * 獲取檔案的下載 URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return apiError('請提供檔案名稱', 400)
    }

    // Vercel Blob URL 直接可存取
    return apiSuccess({
      fileName,
      downloadUrl: fileName,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
