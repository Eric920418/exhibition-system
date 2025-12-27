import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import {
  minioClient,
  uploadFile,
  generateUniqueFileName,
  getFileCategory,
  validateFileType,
  validateFileSize,
  ALLOWED_FILE_TYPES,
} from '@/lib/minio'

/**
 * POST /api/upload
 * 上傳檔案（圖片、影片、文件）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 檢查 MinIO 是否配置
    if (!minioClient) {
      return apiError('檔案儲存服務未配置', 503)
    }

    // 解析 FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'image' | 'video' | 'document'
    const relatedId = formData.get('relatedId') as string | null // 關聯的 ID（展覽、作品等）
    const relatedType = formData.get('relatedType') as string | null // 'exhibition' | 'artwork' | 'team'

    if (!file) {
      return apiError('請選擇要上傳的檔案', 400)
    }

    // 驗證檔案類型
    const fileCategory = getFileCategory(file.type)

    if (!type || !['image', 'video', 'document'].includes(type)) {
      return apiError('無效的檔案類型', 400)
    }

    const allowedTypes = ALLOWED_FILE_TYPES[type as keyof typeof ALLOWED_FILE_TYPES]
    if (!validateFileType(file.type, allowedTypes)) {
      return apiError(`不支持的${type === 'image' ? '圖片' : type === 'video' ? '影片' : '文件'}格式`, 400)
    }

    // 驗證檔案大小
    if (!validateFileSize(file.size, type as 'image' | 'video' | 'document')) {
      const limits = {
        image: '10MB',
        video: '500MB',
        document: '20MB',
      }
      return apiError(`檔案大小超過限制（${limits[type as keyof typeof limits]}）`, 400)
    }

    // 生成唯一檔案名
    const fileName = generateUniqueFileName(file.name)
    const filePath = `${type}s/${fileName}` // images/, videos/, documents/

    // 讀取檔案內容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 上傳到 MinIO
    const fileUrl = await uploadFile(buffer, filePath, file.type, {
      'uploaded-by': user.id,
      'original-name': file.name,
    })

    // 記錄到資料庫（如果有關聯 ID）
    let documentRecord = null

    if (relatedId && relatedType) {
      // 根據類型創建不同的記錄
      const documentData: any = {
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: user.id,
      }

      // 根據 relatedType 設置關聯
      switch (relatedType) {
        case 'exhibition':
          documentData.exhibitionId = relatedId
          break
        case 'artwork':
          // 需要先查詢作品所屬的展覽
          const artwork = await prisma.artwork.findUnique({
            where: { id: relatedId },
            select: {
              team: {
                select: {
                  exhibitionId: true,
                },
              },
            },
          })
          if (artwork) {
            documentData.exhibitionId = artwork.team.exhibitionId
          }
          break
        case 'team':
          const team = await prisma.team.findUnique({
            where: { id: relatedId },
            select: { exhibitionId: true },
          })
          if (team) {
            documentData.exhibitionId = team.exhibitionId
          }
          break
      }

      documentRecord = await prisma.document.create({
        data: documentData,
      })
    }

    return apiSuccess(
      {
        fileName,
        filePath,
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
 * 獲取檔案的預簽名下載 URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    // 檢查 MinIO 是否配置
    if (!minioClient) {
      return apiError('檔案儲存服務未配置', 503)
    }

    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return apiError('請提供檔案名稱', 400)
    }

    // 動態導入以避免頂層依賴
    const { getPresignedUrl } = await import('@/lib/minio')
    const downloadUrl = await getPresignedUrl(fileName)

    return apiSuccess({
      fileName,
      downloadUrl,
      expiresIn: '7 days',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
