import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/lib/auth'
import { apiError, requireAuth } from '@/lib/api-response'

export const maxDuration = 60

const ALLOWED_CONTENT_TYPES = [
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

/**
 * POST /api/upload
 * Client-side upload handler for Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    requireAuth(session)

    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
        }
      },
      onUploadCompleted: async () => {
        // 上傳完成，不需額外處理
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : '上傳失敗'
    return apiError(message, 500)
  }
}
