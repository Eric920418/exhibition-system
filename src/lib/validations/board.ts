import { z } from 'zod'

// ==================== Board 驗證 ====================

/**
 * 創建看板的驗證 schema
 */
export const createBoardSchema = z.object({
  exhibitionId: z.string().uuid('展覽 ID 格式不正確'),
  name: z.string().min(1, '看板名稱不可為空').max(255, '看板名稱過長'),
  description: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
})

/**
 * 更新看板的驗證 schema
 */
export const updateBoardSchema = z.object({
  name: z.string().min(1, '看板名稱不可為空').max(255, '看板名稱過長').optional(),
  description: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
})

/**
 * 查詢看板列表的驗證 schema
 */
export const boardQuerySchema = z.object({
  exhibitionId: z.string().uuid().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('10'),
})

// ==================== List 驗證 ====================

/**
 * 創建列表的驗證 schema
 */
export const createListSchema = z.object({
  title: z.string().min(1, '列表標題不可為空').max(255, '列表標題過長'),
  position: z.number().int().min(0).optional(),
})

/**
 * 更新列表的驗證 schema
 */
export const updateListSchema = z.object({
  title: z.string().min(1, '列表標題不可為空').max(255, '列表標題過長').optional(),
  position: z.number().int().min(0).optional(),
})

/**
 * 重新排序列表的驗證 schema
 */
export const reorderListsSchema = z.object({
  listIds: z.array(z.string().uuid()).min(1, '至少需要一個列表'),
})

// ==================== Card 驗證 ====================

/**
 * 創建卡片的驗證 schema
 */
export const createCardSchema = z.object({
  listId: z.string().uuid('列表 ID 格式不正確'),
  title: z.string().min(1, '卡片標題不可為空').max(255, '卡片標題過長'),
  description: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  dueDate: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().datetime().optional()
  ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  position: z.number().int().min(0).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
})

/**
 * 更新卡片的驗證 schema
 */
export const updateCardSchema = z.object({
  title: z.string().min(1, '卡片標題不可為空').max(255, '卡片標題過長').optional(),
  description: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  dueDate: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().datetime().nullable().optional()
  ),
  priority: z.preprocess(
    (val) => (val === '' ? null : val),
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable().optional()
  ),
  position: z.number().int().min(0).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
})

/**
 * 移動卡片的驗證 schema
 */
export const moveCardSchema = z.object({
  targetListId: z.string().uuid('目標列表 ID 格式不正確'),
  position: z.number().int().min(0),
})

/**
 * 重新排序卡片的驗證 schema
 */
export const reorderCardsSchema = z.object({
  cardIds: z.array(z.string().uuid()).min(1, '至少需要一張卡片'),
})

// ==================== Subtask 驗證 ====================

/**
 * 創建子任務的驗證 schema
 */
export const createSubtaskSchema = z.object({
  title: z.string().min(1, '子任務標題不可為空').max(255, '子任務標題過長'),
  position: z.number().int().min(0).optional(),
})

/**
 * 更新子任務的驗證 schema
 */
export const updateSubtaskSchema = z.object({
  title: z.string().min(1, '子任務標題不可為空').max(255, '子任務標題過長').optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

/**
 * 重新排序子任務的驗證 schema
 */
export const reorderSubtasksSchema = z.object({
  subtaskIds: z.array(z.string().uuid()).min(1, '至少需要一個子任務'),
})

// ==================== Comment 驗證 ====================

/**
 * 創建評論的驗證 schema
 */
export const createCommentSchema = z.object({
  content: z.string().min(1, '評論內容不可為空').max(10000, '評論內容過長'),
})

/**
 * 更新評論的驗證 schema
 */
export const updateCommentSchema = z.object({
  content: z.string().min(1, '評論內容不可為空').max(10000, '評論內容過長'),
})

// ==================== 類型導出 ====================

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type MoveCardInput = z.infer<typeof moveCardSchema>
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
