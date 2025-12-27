'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  relatedType: string | null
  relatedId: string | null
  createdAt: string
}

const notificationTypeIcons: Record<string, string> = {
  CARD_ASSIGNED: '📋',
  CARD_DUE_SOON: '⏰',
  CARD_OVERDUE: '🚨',
  CARD_COMMENT: '💬',
  CARD_UPDATED: '✏️',
  SUBTASK_COMPLETED: '✅',
  MENTION: '@',
  SYSTEM: '🔔',
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // 獲取通知列表
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error('獲取通知失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 獲取未讀數量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?countOnly=true')
      const data = await response.json()

      if (data.success) {
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error('獲取未讀數量失敗:', error)
    }
  }, [])

  // 標記單個通知為已讀
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      })

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('標記已讀失敗:', error)
    }
  }

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      })

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('標記全部已讀失敗:', error)
    }
  }

  // 刪除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      const notification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('刪除通知失敗:', error)
    }
  }

  // 處理通知點擊
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // 根據通知類型導航到相關頁面
    if (notification.relatedType === 'card' && notification.relatedId) {
      // 可以在這裡導航到卡片詳情
      // 由於卡片詳情是彈窗，這裡我們只關閉通知面板
      setIsOpen(false)
    }
  }

  // 初始載入和定期輪詢
  useEffect(() => {
    fetchUnreadCount()

    // 每 30 秒輪詢一次未讀數量
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // 打開時載入通知列表
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">通知</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              全部標記已讀
            </Button>
          )}
        </div>

        <div className="h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              載入中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mb-2 text-gray-300" />
              <p>暫無通知</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      {notificationTypeIcons[notification.type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          title="標記已讀"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              className="w-full text-sm text-gray-600"
              onClick={() => {
                setIsOpen(false)
                // 可以導航到通知列表頁面
              }}
            >
              查看所有通知
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
