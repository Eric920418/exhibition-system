'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanList } from './KanbanList'
import { KanbanCard } from './KanbanCard'
import { CardDetailModal } from './CardDetailModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
  cardId: string
  createdAt: Date | string
}

export interface Assignment {
  id: string
  cardId: string
  userId: string
  assignedAt: Date | string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

export interface Card {
  id: string
  listId: string
  title: string
  description: string | null
  position: number
  dueDate: Date | string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null
  createdBy: string | null
  createdAt: Date | string
  updatedAt: Date | string
  creator: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  } | null
  assignments: Assignment[]
  subtasks: Subtask[]
  _count: {
    comments: number
    subtasks: number
  }
}

export interface List {
  id: string
  boardId: string
  title: string
  position: number
  createdAt: Date | string
  cards: Card[]
}

export interface Board {
  id: string
  name: string
  description: string | null
  createdAt: Date | string
  exhibitionId: string
  exhibition: {
    id: string
    name: string
    year: number
    slug: string
  }
  lists: List[]
}

interface KanbanBoardProps {
  board: Board
  onBoardUpdate: () => void
}

export function KanbanBoard({ board, onBoardUpdate }: KanbanBoardProps) {
  const { toast } = useToast()
  const [lists, setLists] = useState<List[]>(board.lists)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeList, setActiveList] = useState<List | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findListByCardId = useCallback(
    (cardId: string) => {
      return lists.find((list) =>
        list.cards.some((card) => card.id === cardId)
      )
    },
    [lists]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    // 檢查是否是卡片
    const list = findListByCardId(activeId)
    if (list) {
      const card = list.cards.find((c) => c.id === activeId)
      if (card) {
        setActiveCard(card)
        return
      }
    }

    // 檢查是否是列表
    const draggedList = lists.find((l) => l.id === activeId)
    if (draggedList) {
      setActiveList(draggedList)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // 找到被拖動的卡片所在的列表
    const activeList = findListByCardId(activeId)
    if (!activeList) return

    // 找到目標列表
    let overList = findListByCardId(overId)
    if (!overList) {
      // 可能是拖到空列表上
      overList = lists.find((l) => l.id === overId)
    }
    if (!overList) return

    // 如果在同一個列表內，不需要處理
    if (activeList.id === overList.id) return

    // 跨列表移動
    setLists((prevLists) => {
      const activeCards = activeList.cards
      const overCards = overList!.cards
      const activeCard = activeCards.find((c) => c.id === activeId)
      if (!activeCard) return prevLists

      // 計算目標位置
      const overCardIndex = overCards.findIndex((c) => c.id === overId)
      const newIndex = overCardIndex >= 0 ? overCardIndex : overCards.length

      return prevLists.map((list) => {
        if (list.id === activeList.id) {
          return {
            ...list,
            cards: list.cards.filter((c) => c.id !== activeId),
          }
        }
        if (list.id === overList!.id) {
          const newCards = [...list.cards]
          newCards.splice(newIndex, 0, { ...activeCard, listId: list.id })
          return {
            ...list,
            cards: newCards,
          }
        }
        return list
      })
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveCard(null)
    setActiveList(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // 處理列表排序
    const activeListIndex = lists.findIndex((l) => l.id === activeId)
    if (activeListIndex !== -1) {
      const overListIndex = lists.findIndex((l) => l.id === overId)
      if (overListIndex !== -1) {
        const newLists = arrayMove(lists, activeListIndex, overListIndex)
        setLists(newLists)

        // 同步到後端
        try {
          await fetch(`/api/boards/${board.id}/lists`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listIds: newLists.map((l) => l.id),
            }),
          })
        } catch (error) {
          toast({
            title: '錯誤',
            description: '列表排序失敗',
            variant: 'destructive',
          })
          setLists(board.lists)
        }
        return
      }
    }

    // 處理卡片排序
    const activeList = findListByCardId(activeId)
    if (!activeList) return

    let targetList = findListByCardId(overId)
    if (!targetList) {
      targetList = lists.find((l) => l.id === overId)
    }
    if (!targetList) return

    const activeCard = activeList.cards.find((c) => c.id === activeId)
    if (!activeCard) return

    // 計算新位置
    const overCardIndex = targetList.cards.findIndex((c) => c.id === overId)
    const newPosition = overCardIndex >= 0 ? overCardIndex : targetList.cards.length

    // 同步到後端
    try {
      await fetch(`/api/cards/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetListId: targetList.id,
          position: newPosition,
        }),
      })
    } catch (error) {
      toast({
        title: '錯誤',
        description: '卡片移動失敗',
        variant: 'destructive',
      })
      setLists(board.lists)
    }
  }

  const handleAddList = async () => {
    if (!newListTitle.trim()) return

    try {
      const response = await fetch(`/api/boards/${board.id}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle }),
      })

      const data = await response.json()

      if (data.success) {
        setLists((prev) => [...prev, { ...data.data, cards: [] }])
        setNewListTitle('')
        setIsAddingList(false)
        toast({
          title: '成功',
          description: '列表創建成功',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '列表創建失敗',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateList = async (listId: string, title: string) => {
    try {
      const response = await fetch(`/api/boards/${board.id}/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      const data = await response.json()

      if (data.success) {
        setLists((prev) =>
          prev.map((list) =>
            list.id === listId ? { ...list, title } : list
          )
        )
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '列表更新失敗',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('確定要刪除此列表嗎？列表中的所有卡片也會被刪除。')) return

    try {
      const response = await fetch(`/api/boards/${board.id}/lists/${listId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setLists((prev) => prev.filter((list) => list.id !== listId))
        toast({
          title: '成功',
          description: '列表已刪除',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '列表刪除失敗',
        variant: 'destructive',
      })
    }
  }

  const handleAddCard = async (listId: string, title: string) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, title }),
      })

      const data = await response.json()

      if (data.success) {
        setLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? { ...list, cards: [...list.cards, data.data] }
              : list
          )
        )
        toast({
          title: '成功',
          description: '卡片創建成功',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '卡片創建失敗',
        variant: 'destructive',
      })
    }
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handleCardUpdate = (updatedCard: Card) => {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      }))
    )
    setSelectedCard(updatedCard)
  }

  const handleCardDelete = (cardId: string) => {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.filter((card) => card.id !== cardId),
      }))
    )
    setSelectedCard(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            {lists.map((list) => (
              <KanbanList
                key={list.id}
                list={list}
                onUpdateTitle={(title) => handleUpdateList(list.id, title)}
                onDelete={() => handleDeleteList(list.id)}
                onAddCard={(title) => handleAddCard(list.id, title)}
                onCardClick={handleCardClick}
              />
            ))}
          </SortableContext>

          {/* 新增列表 */}
          <div className="flex-shrink-0 w-72">
            {isAddingList ? (
              <div className="bg-gray-100 rounded-lg p-3">
                <Input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="輸入列表標題..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList()
                    if (e.key === 'Escape') {
                      setIsAddingList(false)
                      setNewListTitle('')
                    }
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleAddList}>
                    新增列表
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingList(false)
                      setNewListTitle('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-3 text-gray-600 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增列表
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <KanbanCard card={activeCard} isDragging onCardClick={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      {/* 卡片詳情 Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </>
  )
}
