import { z } from 'zod'

// DocumentType enum 需與 Prisma schema 一致
export const DocumentTypeEnum = z.enum(['PROPOSAL', 'DESIGN', 'PLAN', 'OTHER'])

// 創建文件記錄（上傳後）
export const createDocumentSchema = z.object({
  exhibitionId: z.string().uuid('無效的展覽 ID'),
  type: DocumentTypeEnum,
  title: z.string().min(1, '標題不能為空').max(255, '標題過長'),
  fileUrl: z.string().url('無效的檔案 URL'),
  fileSize: z.number().int().positive('無效的檔案大小').optional(),
  mimeType: z.string().max(100, 'MIME 類型過長').optional(),
  version: z.number().int().positive('無效的版本號').optional().default(1),
})

// 更新文件
export const updateDocumentSchema = z.object({
  type: DocumentTypeEnum.optional(),
  title: z.string().min(1, '標題不能為空').max(255, '標題過長').optional(),
  version: z.number().int().positive('無效的版本號').optional(),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
