import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markNotificationAsRead, deleteNotification } from '@/lib/notification'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ notificationId: string }>
}

/**
 * GET /api/notifications/[notificationId]
 * 獲取單個通知詳情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      )
    }

    const { notificationId } = await params

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, error: '通知不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
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
 * PUT /api/notifications/[notificationId]
 * 標記通知為已讀
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      )
    }

    const { notificationId } = await params

    await markNotificationAsRead(notificationId, session.user.id)

    return NextResponse.json({
      success: true,
      message: '通知已標記為已讀',
    })
  } catch (error) {
    console.error('更新通知失敗:', error)
    return NextResponse.json(
      { success: false, error: '更新通知失敗' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * 刪除通知
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '請先登入' },
        { status: 401 }
      )
    }

    const { notificationId } = await params

    await deleteNotification(notificationId, session.user.id)

    return NextResponse.json({
      success: true,
      message: '通知已刪除',
    })
  } catch (error) {
    console.error('刪除通知失敗:', error)
    return NextResponse.json(
      { success: false, error: '刪除通知失敗' },
      { status: 500 }
    )
  }
}
