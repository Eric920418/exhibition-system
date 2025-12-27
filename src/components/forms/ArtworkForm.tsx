'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface ArtworkFormProps {
  artwork?: {
    id: string
    title: string
    concept?: string | null
    mediaUrls: string[]
    thumbnailUrl?: string | null
    displayOrder: number
    isPublished: boolean
    teamId: string
  }
  teamId?: string
  mode: 'create' | 'edit'
}

export default function ArtworkForm({ artwork, teamId, mode }: ArtworkFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    concept: artwork?.concept || '',
    thumbnailUrl: artwork?.thumbnailUrl || '',
    displayOrder: artwork?.displayOrder || 0,
    isPublished: artwork?.isPublished ?? false,
    mediaUrls: artwork?.mediaUrls?.join('\n') || '', // 每行一個 URL
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        concept: formData.concept || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        displayOrder: Number(formData.displayOrder),
        isPublished: formData.isPublished,
        // 將多行文本轉換為數組
        mediaUrls: formData.mediaUrls
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0),
      }

      if (mode === 'create') {
        if (!teamId) {
          toast({
            title: '錯誤',
            description: '缺少團隊 ID',
            variant: 'destructive',
          })
          return
        }
        payload.teamId = teamId
        await apiClient.post('/artworks', payload)
        toast({
          title: '創建成功',
          description: '作品已成功創建',
        })
        router.push('/admin/artworks')
      } else {
        await apiClient.patch(`/artworks/${artwork?.id}`, payload)
        toast({
          title: '更新成功',
          description: '作品已成功更新',
        })
        router.push(`/admin/artworks/${artwork?.id}`)
      }
    } catch (error: any) {
      toast({
        title: mode === 'create' ? '創建失敗' : '更新失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              作品名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="請輸入作品名稱"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">作品概念</Label>
            <Textarea
              id="concept"
              name="concept"
              value={formData.concept}
              onChange={handleChange}
              rows={4}
              placeholder="描述作品的創作理念、背景等..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">縮圖 URL</Label>
            <Input
              id="thumbnailUrl"
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://example.com/thumbnail.jpg"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2">
                <img
                  src={formData.thumbnailUrl}
                  alt="縮圖預覽"
                  className="max-w-xs rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaUrls">媒體 URLs（每行一個）</Label>
            <Textarea
              id="mediaUrls"
              name="mediaUrls"
              value={formData.mediaUrls}
              onChange={handleChange}
              rows={6}
              className="font-mono text-sm"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/video1.mp4&#10;https://example.com/image2.jpg"
            />
            <p className="text-sm text-muted-foreground">
              每行輸入一個圖片或影片 URL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">顯示順序</Label>
              <Input
                id="displayOrder"
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                數字越小越靠前
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                發布作品（公開顯示）
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? '處理中...' : mode === 'create' ? '創建作品' : '更新作品'}
        </Button>
      </div>
    </form>
  )
}
