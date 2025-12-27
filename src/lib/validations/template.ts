import { z } from 'zod'

// 創建網站模板
export const createSiteTemplateSchema = z.object({
  exhibitionId: z.string().uuid('無效的展覽 ID'),
  name: z.string().min(1, '模板名稱不能為空').max(255, '模板名稱過長'),
  templateJson: z.record(z.any()), // Craft.js JSON 狀態
  previewImageUrl: z.string().url('無效的預覽圖 URL').optional(),
})

// 更新網站模板
export const updateSiteTemplateSchema = z.object({
  name: z.string().min(1, '模板名稱不能為空').max(255, '模板名稱過長').optional(),
  templateJson: z.record(z.any()).optional(), // Craft.js JSON 狀態
  isPublished: z.boolean().optional(),
  previewImageUrl: z.string().url('無效的預覽圖 URL').optional().nullable(),
})

// 發布模板
export const publishTemplateSchema = z.object({
  isPublished: z.boolean(),
})

// 創建預設模板
export const createPresetTemplateSchema = z.object({
  name: z.string().min(1, '模板名稱不能為空').max(255, '模板名稱過長'),
  category: z.string().max(50, '分類名稱過長').optional(),
  templateJson: z.record(z.any()),
  previewImageUrl: z.string().url('無效的預覽圖 URL').optional(),
})

export type CreateSiteTemplateInput = z.infer<typeof createSiteTemplateSchema>
export type UpdateSiteTemplateInput = z.infer<typeof updateSiteTemplateSchema>
export type PublishTemplateInput = z.infer<typeof publishTemplateSchema>
export type CreatePresetTemplateInput = z.infer<typeof createPresetTemplateSchema>
