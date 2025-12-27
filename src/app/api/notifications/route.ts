import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from '@/lib/notification'

/**
 * GET /api/notifications
 * 獲取當前用戶的通知列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const countOnly = searchParams.get('countOnly') === 'true'

    // 如果只需要數量
    if (countOnly) {
      const unreadCount = await getUnreadNotificationCount(session.user.id)
      return NextResponse.json({
        success: true,
        data: { unreadCount },
      })
    }

    const result = await getUserNotifications(session.user.id, {
      page,
      limit,
      unreadOnly,
    })

    // 同時取得未讀數量
    const unreadCount = await getUnreadNotificationCount(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        unreadCount,
      },
    })
  } catch (error) {
    console.error('獲取通知失敗:', error)
    return NextResponse.json(
      { success: false, error: '獲取通知失敗' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications
 * 標記所有通知為已讀
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (body.action === 'markAllAsRead') {
      await markAllNotificationsAsRead(session.user.id)
      return NextResponse.json({
        success: true,
        message: '所有通知已標記為已讀',
      })
    }

    return NextResponse.json(
      { success: false, error: '未知的操作' },
      { status: 400 }
    )
  } catch (error) {
    console.error('更新通知失敗:', error)
    return NextResponse.json(
      { success: false, error: '更新通知失敗' },
      { status: 500 }
    )
  }
}
