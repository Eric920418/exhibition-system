'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Save, LayoutGrid, Calendar, FileText } from 'lucide-react'

interface BoardSettingsClientProps {
  board: {
    id: string
    name: string
    description: string | null
    exhibitionId: string
    exhibitionName: string
    exhibitionYear: number
    listsCount: number
    cardsCount: number
    createdAt: string
  }
}

export function BoardSettingsClient({ board }: BoardSettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: board.name,
    description: board.description || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '更新失敗')
      }

      toast({
        title: '更新成功',
        description: '看板設定已儲存',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: '更新失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '刪除失敗')
      }

      toast({
        title: '刪除成功',
        description: '看板已刪除',
      })

      router.push('/admin/boards')
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
      setDeleteLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* 基本資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
          <CardDescription>編輯看板的名稱和描述</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                看板名稱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="輸入看板名稱"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="輸入看板描述（選填）"
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? '儲存中...' : '儲存變更'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 看板統計 */}
      <Card>
        <CardHeader>
          <CardTitle>看板資訊</CardTitle>
          <CardDescription>看板的相關統計資料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">列表數</p>
                <p className="text-xl font-semibold">{board.listsCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">卡片數</p>
                <p className="text-xl font-semibold">{board.cardsCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">建立時間</p>
                <p className="text-sm font-medium">
                  {new Date(board.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                {board.exhibitionYear.toString().slice(-2)}
              </div>
              <div>
                <p className="text-sm text-gray-500">所屬展覽</p>
                <p className="text-sm font-medium">{board.exhibitionName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 危險區域 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">危險區域</CardTitle>
          <CardDescription>
            刪除看板將會永久移除所有列表和卡片，此操作無法復原
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteLoading ? '刪除中...' : '刪除看板'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要刪除此看板嗎？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作將永久刪除看板「{board.name}」，包含：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{board.listsCount} 個列表</li>
                    <li>{board.cardsCount} 張卡片</li>
                    <li>所有子任務和評論</li>
                  </ul>
                  <p className="mt-2 font-medium text-red-600">
                    此操作無法復原！
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  確定刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
