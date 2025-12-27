import { z } from 'zod'

// ==================== 預約設定驗證 ====================

/**
 * 時間格式驗證 (HH:MM)
 */
const timeStringSchema = z.string().regex(
  /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  '時間格式需為 HH:MM（例如 09:00 或 18:30）'
)

/**
 * 台灣手機號碼驗證
 */
const taiwanPhoneSchema = z.string().regex(
  /^09\d{8}$/,
  '請輸入有效的台灣手機號碼（09 開頭的 10 位數字）'
)

/**
 * 日期字串驗證 (YYYY-MM-DD)
 */
const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  '日期格式需為 YYYY-MM-DD'
)

/**
 * 創建預約設定 Schema
 */
export const createReservationConfigSchema = z.object({
  teamId: z.string().uuid('無效的組別 ID'),
  slotDurationMinutes: z
    .number()
    .int('時段長度必須為整數')
    .min(5, '時段長度至少 5 分鐘')
    .max(120, '時段長度最多 120 分鐘'),
  breakDurationMinutes: z
    .number()
    .int('休息時間必須為整數')
    .min(0, '休息時間不可為負數')
    .max(60, '休息時間最多 60 分鐘'),
  maxConcurrentCapacity: z
    .number()
    .int('容量必須為整數')
    .min(1, '至少需要 1 個服務容量')
    .max(10, '最多 10 個並發服務容量'),
  dailyStartTime: timeStringSchema,
  dailyEndTime: timeStringSchema,
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    const [startH, startM] = data.dailyStartTime.split(':').map(Number)
    const [endH, endM] = data.dailyEndTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    return endMinutes > startMinutes
  },
  {
    message: '結束時間必須晚於開始時間',
    path: ['dailyEndTime'],
  }
)

/**
 * 更新預約設定 Schema
 */
export const updateReservationConfigSchema = z.object({
  slotDurationMinutes: z
    .number()
    .int()
    .min(5)
    .max(120)
    .optional(),
  breakDurationMinutes: z
    .number()
    .int()
    .min(0)
    .max(60)
    .optional(),
  maxConcurrentCapacity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional(),
  dailyStartTime: timeStringSchema.optional(),
  dailyEndTime: timeStringSchema.optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.dailyStartTime && data.dailyEndTime) {
      const [startH, startM] = data.dailyStartTime.split(':').map(Number)
      const [endH, endM] = data.dailyEndTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return endMinutes > startMinutes
    }
    return true
  },
  {
    message: '結束時間必須晚於開始時間',
    path: ['dailyEndTime'],
  }
)

/**
 * 預約設定查詢 Schema
 */
export const reservationConfigQuerySchema = z.object({
  exhibitionId: z.string().uuid().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
})

// ==================== 預約記錄驗證 ====================

/**
 * 創建預約（取號）Schema
 */
export const createReservationSchema = z.object({
  teamId: z.string().uuid('無效的組別 ID'),
  visitorName: z
    .string()
    .min(1, '訪客姓名不可為空')
    .max(100, '訪客姓名過長'),
  visitorPhone: taiwanPhoneSchema,
  reservationDate: dateStringSchema,
  notes: z.string().max(500, '備註最多 500 字').optional(),
})

/**
 * 查詢個人預約狀態 Schema
 */
export const myReservationStatusSchema = z.object({
  phone: taiwanPhoneSchema,
  date: dateStringSchema.optional(),
})

/**
 * 取消預約 Schema
 */
export const cancelReservationSchema = z.object({
  phone: taiwanPhoneSchema,
})

/**
 * 預約記錄查詢 Schema
 */
export const reservationQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  date: dateStringSchema.optional(),
  status: z
    .enum(['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
})

// ==================== 叫號操作驗證 ====================

/**
 * 指定叫號 Schema
 */
export const callReservationSchema = z.object({
  reservationId: z.string().uuid('無效的預約 ID'),
})

/**
 * 標記完成/未到 Schema
 */
export const completeReservationSchema = z.object({
  reservationId: z.string().uuid('無效的預約 ID'),
})

/**
 * 重新排隊 Schema
 */
export const requeueReservationSchema = z.object({
  reservationId: z.string().uuid('無效的預約 ID'),
})

// ==================== 管理操作驗證 ====================

/**
 * 批量處理未完成預約 Schema
 */
export const cleanupReservationsSchema = z.object({
  teamId: z.string().uuid('無效的組別 ID'),
  date: dateStringSchema,
  action: z.enum(['NO_SHOW', 'CANCEL'], {
    errorMap: () => ({ message: '操作類型必須是 NO_SHOW 或 CANCEL' }),
  }),
})

/**
 * 統計查詢 Schema
 */
export const reservationStatsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end >= start
  },
  {
    message: '結束日期必須晚於或等於開始日期',
    path: ['endDate'],
  }
)

/**
 * 匯出報表 Schema
 */
export const reservationExportSchema = z.object({
  teamId: z.string().uuid().optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  format: z.enum(['csv', 'json']).default('csv'),
})

// ==================== 類型導出 ====================

export type CreateReservationConfigInput = z.infer<typeof createReservationConfigSchema>
export type UpdateReservationConfigInput = z.infer<typeof updateReservationConfigSchema>
export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>
export type ReservationStatsQueryInput = z.infer<typeof reservationStatsQuerySchema>
