'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

interface Exhibition {
  id: string
  name: string
  year: number
}

export default function NewBoardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [formData, setFormData] = useState({
    exhibitionId: '',
    name: '',
    description: '',
  })

  useEffect(() => {
    // 獲取展覽列表
    fetch('/api/exhibitions?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExhibitions(data.data.exhibitions)
        }
      })
      .catch((error) => {
        console.error('獲取展覽列表失敗:', error)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.exhibitionId) {
      toast({
        title: '錯誤',
        description: '請選擇關聯的展覽',
        variant: 'destructive',
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: '錯誤',
        description: '請輸入看板名稱',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '看板創建成功',
        })
        router.push(`/admin/boards/${data.data.id}`)
      } else {
        toast({
          title: '錯誤',
          description: data.error || '創建失敗',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '網路錯誤，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/boards"
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回看板列表
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">創建新看板</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="exhibitionId">
              關聯展覽 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.exhibitionId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, exhibitionId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇展覽" />
              </SelectTrigger>
              <SelectContent>
                {exhibitions.map((exhibition) => (
                  <SelectItem key={exhibition.id} value={exhibition.id}>
                    {exhibition.name} ({exhibition.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              選擇此看板所屬的展覽
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              看板名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="例如：展覽籌備進度"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="簡述此看板的用途..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '創建中...' : '創建看板'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
