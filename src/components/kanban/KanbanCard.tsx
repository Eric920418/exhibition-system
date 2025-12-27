'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Card } from './KanbanBoard'

interface KanbanCardProps {
  card: Card
  isDragging?: boolean
  onCardClick: (card: Card) => void
}

const priorityConfig = {
  LOW: { label: '低', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: '中', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: '緊急', color: 'bg-red-100 text-red-600' },
}

export function KanbanCard({ card, isDragging, onCardClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const completedSubtasks = card.subtasks.filter((s) => s.completed).length
  const totalSubtasks = card.subtasks.length

  const getDueDateStatus = () => {
    if (!card.dueDate) return null
    const dueDate = new Date(card.dueDate)
    if (isPast(dueDate) && !isToday(dueDate)) return 'overdue'
    if (isToday(dueDate)) return 'today'
    return 'upcoming'
  }

  const dueDateStatus = getDueDateStatus()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick(card)}
      className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-3 cursor-pointer group ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* 優先級標籤 */}
      {card.priority && (
        <div className="mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              priorityConfig[card.priority].color
            }`}
          >
            {priorityConfig[card.priority].label}
          </span>
        </div>
      )}

      {/* 標題 */}
      <h4 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
        {card.title}
      </h4>

      {/* 描述預覽 */}
      {card.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* 元數據 */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {/* 到期日 */}
        {card.dueDate && (
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
              dueDateStatus === 'overdue'
                ? 'bg-red-100 text-red-600'
                : dueDateStatus === 'today'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {dueDateStatus === 'overdue' ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {format(new Date(card.dueDate), 'M/d', { locale: zhTW })}
          </div>
        )}

        {/* 子任務進度 */}
        {totalSubtasks > 0 && (
          <div
            className={`flex items-center gap-1 ${
              completedSubtasks === totalSubtasks
                ? 'text-green-600'
                : 'text-gray-500'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            {completedSubtasks}/{totalSubtasks}
          </div>
        )}

        {/* 評論數 */}
        {card._count.comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {card._count.comments}
          </div>
        )}
      </div>

      {/* 指派的用戶 */}
      {card.assignments.length > 0 && (
        <div className="flex items-center gap-1 mt-2 -space-x-2">
          {card.assignments.slice(0, 3).map((assignment) => (
            <Avatar
              key={assignment.id}
              className="w-6 h-6 border-2 border-white"
            >
              <AvatarImage src={assignment.user.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {assignment.user.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
          {card.assignments.length > 3 && (
            <span className="text-xs text-gray-500 ml-2">
              +{card.assignments.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
