'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanCard } from './KanbanCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Trash2, Edit2, X, GripVertical } from 'lucide-react'
import type { List, Card } from './KanbanBoard'

interface KanbanListProps {
  list: List
  onUpdateTitle: (title: string) => void
  onDelete: () => void
  onAddCard: (title: string) => void
  onCardClick: (card: Card) => void
}

export function KanbanList({
  list,
  onUpdateTitle,
  onDelete,
  onAddCard,
  onCardClick,
}: KanbanListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleTitleSubmit = () => {
    if (title.trim() && title !== list.title) {
      onUpdateTitle(title.trim())
    } else {
      setTitle(list.title)
    }
    setIsEditingTitle(false)
  }

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim())
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-gray-100 rounded-lg flex flex-col max-h-[calc(100vh-220px)]"
    >
      {/* 列表標題 */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-gray-200 rounded p-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>

          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit()
                if (e.key === 'Escape') {
                  setTitle(list.title)
                  setIsEditingTitle(false)
                }
              }}
              autoFocus
              className="h-7 text-sm font-semibold"
            />
          ) : (
            <h3
              className="font-semibold text-gray-700 cursor-pointer hover:text-gray-900"
              onClick={() => setIsEditingTitle(true)}
            >
              {list.title}
            </h3>
          )}
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {list.cards.length}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              編輯標題
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              刪除列表
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onCardClick={onCardClick}
            />
          ))}
        </SortableContext>

        {/* 新增卡片 */}
        {isAddingCard ? (
          <div className="bg-white rounded-lg shadow p-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="輸入卡片標題..."
              className="w-full border-0 resize-none focus:ring-0 text-sm p-1"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddCard()
                }
                if (e.key === 'Escape') {
                  setIsAddingCard(false)
                  setNewCardTitle('')
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleAddCard}>
                新增
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingCard(false)
                  setNewCardTitle('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full text-left px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded flex items-center gap-1 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增卡片
          </button>
        )}
      </div>
    </div>
  )
}
