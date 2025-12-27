import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'
import { createUserSchema, userQuerySchema } from '@/lib/validations/user'
import { createAuditLog, AuditAction, extractRequestInfo } from '@/lib/audit-log'

/**
 * GET /api/users
 * 獲取用戶列表（僅 SUPER_ADMIN）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    // 僅超級管理員可以查看用戶列表
    if (user.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限查看用戶列表', 403)
    }

    // 解析查詢參數
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { role, isActive, search, page, limit } = userQuerySchema.parse(searchParams)

    // 構建查詢條件
    const where: any = {}

    if (role) {
      where.role = role
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 計算分頁
    const skip = (page - 1) * limit
    const take = limit

    // 並行查詢總數和數據
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              exhibitionsCreated: true,
              artworksCreated: true,
              teamsLed: true,
            },
          },
        },
      }),
    ])

    return apiSuccess({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/users
 * 創建新用戶（僅 SUPER_ADMIN）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const currentUser = requireAuth(session)

    // 僅超級管理員可以創建用戶
    if (currentUser.role !== 'SUPER_ADMIN') {
      return apiError('沒有權限創建用戶', 403)
    }

    // 解析並驗證請求體
    const body = await request.json()
    const data = createUserSchema.parse(body)

    // 檢查郵箱是否已存在
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return apiError('該電子郵件已被註冊', 409)
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 創建用戶
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: hashedPassword,
        role: data.role,
        avatarUrl: data.avatarUrl,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    })

    // 記錄審計日誌
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await createAuditLog({
      action: AuditAction.USER_REGISTER,
      userId: currentUser.id,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        createdBy: currentUser.id,
      },
      ipAddress,
      userAgent,
    })

    return apiSuccess(user, '用戶創建成功', 201)
  } catch (error) {
    return handleApiError(error)
  }
}
