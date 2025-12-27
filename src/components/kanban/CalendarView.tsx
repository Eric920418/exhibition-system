'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Card, Board } from './KanbanBoard'

interface CalendarViewProps {
  board: Board
  onCardClick?: (card: Card) => void
}

const priorityColors = {
  LOW: 'bg-gray-100 border-gray-300 text-gray-700',
  MEDIUM: 'bg-blue-100 border-blue-300 text-blue-700',
  HIGH: 'bg-orange-100 border-orange-300 text-orange-700',
  URGENT: 'bg-red-100 border-red-300 text-red-700',
}

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '緊急',
}

export function CalendarView({ board, onCardClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // 收集所有卡片
  const allCards = useMemo(() => {
    return board.lists.flatMap((list) =>
      list.cards.map((card) => ({
        ...card,
        listTitle: list.title,
      }))
    )
  }, [board.lists])

  // 按日期分組卡片
  const cardsByDate = useMemo(() => {
    const map = new Map<string, typeof allCards>()

    allCards.forEach((card) => {
      if (card.dueDate) {
        const dateKey = format(new Date(card.dueDate), 'yyyy-MM-dd')
        const existing = map.get(dateKey) || []
        map.set(dateKey, [...existing, card])
      }
    })

    return map
  }, [allCards])

  // 計算日曆網格
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayCards = cardsByDate.get(dateKey) || []

    if (dayCards.length > 0) {
      setSelectedDate(date)
      setShowDayModal(true)
    }
  }

  const selectedDateCards = selectedDate
    ? cardsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : []

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 日曆頭部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentDate, 'yyyy年 M月', { locale: zhTW })}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            今天
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 統計信息 */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>緊急: {allCards.filter((c) => c.priority === 'URGENT' && c.dueDate).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>高優先: {allCards.filter((c) => c.priority === 'HIGH' && c.dueDate).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>中優先: {allCards.filter((c) => c.priority === 'MEDIUM' && c.dueDate).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>有到期日: {allCards.filter((c) => c.dueDate).length}</span>
        </div>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日曆網格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayCards = cardsByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isTodayDate ? 'border-blue-500 border-2' : 'border-gray-200'}
                ${dayCards.length > 0 ? 'hover:bg-gray-50' : ''}
              `}
            >
              <div
                className={`
                  text-sm font-medium mb-1
                  ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}
              >
                {format(day, 'd')}
              </div>

              {/* 卡片預覽 */}
              <div className="space-y-1">
                {dayCards.slice(0, 3).map((card) => (
                  <div
                    key={card.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCardClick?.(card)
                    }}
                    className={`
                      text-xs p-1 rounded truncate border
                      ${card.priority ? priorityColors[card.priority] : 'bg-gray-50 border-gray-200 text-gray-700'}
                    `}
                    title={card.title}
                  >
                    {card.title}
                  </div>
                ))}
                {dayCards.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayCards.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 日期詳情彈窗 */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedDate && format(selectedDate, 'yyyy年 M月 d日 EEEE', { locale: zhTW })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedDateCards.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  onCardClick?.(card)
                  setShowDayModal(false)
                }}
                className={`
                  p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                  ${card.priority ? priorityColors[card.priority] : 'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{card.title}</h4>
                  {card.priority && (
                    <Badge variant="outline" className="text-xs">
                      {priorityLabels[card.priority]}
                    </Badge>
                  )}
                </div>

                {card.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {card.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="bg-gray-200 px-2 py-0.5 rounded">
                    {card.listTitle}
                  </span>

                  {card.assignments.length > 0 && (
                    <div className="flex -space-x-2">
                      {card.assignments.slice(0, 3).map((assignment) => (
                        <Avatar
                          key={assignment.id}
                          className="w-5 h-5 border border-white"
                        >
                          <AvatarImage src={assignment.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {assignment.user.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedDateCards.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                此日期沒有任務
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
