'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import {
  CalendarIcon,
  Trash2,
  Plus,
  X,
  Send,
  CheckSquare,
  MessageSquare,
  Clock,
  Flag,
  Edit2,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Card, Subtask } from './KanbanBoard'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  } | null
}

interface CardDetailModalProps {
  card: Card
  onClose: () => void
  onUpdate: (card: Card) => void
  onDelete: (cardId: string) => void
}

const priorityOptions = [
  { value: 'LOW', label: '低', color: 'text-gray-600' },
  { value: 'MEDIUM', label: '中', color: 'text-blue-600' },
  { value: 'HIGH', label: '高', color: 'text-orange-600' },
  { value: 'URGENT', label: '緊急', color: 'text-red-600' },
]

export function CardDetailModal({
  card,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  const { toast } = useToast()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [priority, setPriority] = useState<string>(card.priority || '')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.dueDate ? new Date(card.dueDate) : undefined
  )
  const [subtasks, setSubtasks] = useState<Subtask[]>(card.subtasks)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 載入評論
  useEffect(() => {
    fetch(`/api/cards/${card.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments(data.data.comments)
        }
      })
      .finally(() => setIsLoadingComments(false))
  }, [card.id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          priority: priority || null,
          dueDate: dueDate ? dueDate.toISOString() : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onUpdate({
          ...card,
          title,
          description,
          priority: (priority as Card['priority']) || null,
          dueDate: dueDate ? dueDate.toISOString() : null,
          subtasks,
        })
        toast({ title: '成功', description: '卡片已更新' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '更新失敗',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('確定要刪除此卡片嗎？')) return

    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(card.id)
        toast({ title: '成功', description: '卡片已刪除' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '刪除失敗',
        variant: 'destructive',
      })
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    try {
      const response = await fetch(`/api/cards/${card.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle }),
      })

      const data = await response.json()

      if (data.success) {
        setSubtasks((prev) => [...prev, data.data])
        setNewSubtaskTitle('')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '添加子任務失敗',
        variant: 'destructive',
      })
    }
  }

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const response = await fetch(
        `/api/cards/${card.id}/subtasks/${subtask.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !subtask.completed }),
        }
      )

      const data = await response.json()

      if (data.success) {
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === subtask.id ? { ...s, completed: !s.completed } : s
          )
        )
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '更新子任務失敗',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(
        `/api/cards/${card.id}/subtasks/${subtaskId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (data.success) {
        setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '刪除子任務失敗',
        variant: 'destructive',
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      const data = await response.json()

      if (data.success) {
        setComments((prev) => [data.data, ...prev])
        setNewComment('')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '添加評論失敗',
        variant: 'destructive',
      })
    }
  }

  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const subtaskProgress =
    subtasks.length > 0
      ? Math.round((completedSubtasks / subtasks.length) * 100)
      : 0

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
                autoFocus
                className="text-lg font-semibold"
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="cursor-pointer hover:text-blue-600"
              >
                {title}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 描述 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              描述
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述..."
              rows={3}
            />
          </div>

          {/* 優先級和到期日 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                優先級
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇優先級" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">無</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                到期日
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate
                      ? format(dueDate, 'PPP', { locale: zhTW })
                      : '選擇日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDueDate(undefined)}
                      >
                        清除日期
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 子任務 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              子任務
              {subtasks.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({completedSubtasks}/{subtasks.length})
                </span>
              )}
            </Label>

            {subtasks.length > 0 && (
              <Progress value={subtaskProgress} className="h-2" />
            )}

            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 group"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(subtask)}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      subtask.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-700'
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="添加子任務..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                }}
              />
              <Button size="sm" onClick={handleAddSubtask}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 評論 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              評論 ({comments.length})
            </Label>

            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="添加評論..."
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {isLoadingComments ? (
              <div className="text-center text-gray-500 py-4">載入中...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-500 py-4">暫無評論</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user?.avatarUrl || undefined} />
                      <AvatarFallback>
                        {comment.user?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.user?.name || '未知用戶'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), 'MM/dd HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              刪除卡片
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
