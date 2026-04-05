'use client'

import { useState, useRef } from 'react'
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
    conceptShort?: string | null
    mediaUrls: string[]
    thumbnailUrl?: string | null
    displayOrder: number
    isPublished: boolean
    teamId: string
    team?: {
      name: string
      exhibition: { name: string; year: number }
    }
  }
  teamId?: string
  teamInfo?: {
    name: string
    exhibition: { name: string; year: number }
  }
  mode: 'create' | 'edit'
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url)
}

export default function ArtworkForm({ artwork, teamId, teamInfo, mode }: ArtworkFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    conceptShort: artwork?.conceptShort || '',
    concept: artwork?.concept || '',
    displayOrder: artwork?.displayOrder ?? 0,
    isPublished: artwork?.isPublished ?? false,
  })

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(artwork?.thumbnailUrl ?? '')
  const [mediaUrls, setMediaUrls] = useState<string[]>(artwork?.mediaUrls ?? [])
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const teamDisplay = artwork?.team ?? teamInfo

  async function uploadFile(file: File, type: 'image' | 'video'): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '上傳失敗')
    }
    const result = await res.json()
    return result.data.fileUrl
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumbnail(true)
    try {
      const url = await uploadFile(file, 'image')
      setThumbnailUrl(url)
    } catch (error: any) {
      toast({ title: '縮圖上傳失敗', description: error.message, variant: 'destructive' })
    } finally {
      setUploadingThumbnail(false)
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
    }
  }

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploadingMedia(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const type = file.type.startsWith('video/') ? 'video' : 'image'
        const url = await uploadFile(file, type)
        urls.push(url)
      }
      setMediaUrls((prev) => [...prev, ...urls])
    } catch (error: any) {
      toast({ title: '媒體上傳失敗', description: error.message, variant: 'destructive' })
    } finally {
      setUploadingMedia(false)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        conceptShort: formData.conceptShort || null,
        concept: formData.concept || null,
        thumbnailUrl: thumbnailUrl || null,
        mediaUrls,
        displayOrder: Number(formData.displayOrder),
        isPublished: formData.isPublished,
      }

      if (mode === 'create') {
        if (!teamId) {
          toast({ title: '錯誤', description: '缺少團隊 ID', variant: 'destructive' })
          return
        }
        payload.teamId = teamId
        await apiClient.post('/artworks', payload)
        toast({ title: '創建成功', description: '作品已成功創建' })
        router.push('/admin/artworks')
      } else {
        await apiClient.patch(`/artworks/${artwork?.id}`, payload)
        toast({ title: '更新成功', description: '作品已成功更新' })
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 團隊資訊 */}
      {teamDisplay && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <span className="font-medium">所屬團隊：</span>{teamDisplay.name}
          <span className="mx-2">·</span>
          <span className="font-medium">展覽：</span>
          {teamDisplay.exhibition.name} ({teamDisplay.exhibition.year})
        </div>
      )}

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
            <Label htmlFor="conceptShort">作品簡介（短）</Label>
            <Textarea
              id="conceptShort"
              name="conceptShort"
              value={formData.conceptShort}
              onChange={handleChange}
              rows={2}
              maxLength={500}
              placeholder="簡短描述作品（500 字以內），顯示於作品列表卡片"
            />
            <p className="text-sm text-muted-foreground">
              {formData.conceptShort.length}/500 字 · 可直接貼上網址，會自動轉為超連結
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">作品介紹（長）</Label>
            <Textarea
              id="concept"
              name="concept"
              value={formData.concept}
              onChange={handleChange}
              rows={6}
              placeholder="完整描述作品的創作理念、背景、技術等..."
            />
            <p className="text-sm text-muted-foreground">
              可直接貼上網址，會自動轉為超連結
            </p>
          </div>

          {/* 縮圖上傳 */}
          <div className="space-y-2">
            <Label>縮圖</Label>
            {thumbnailUrl ? (
              <div className="space-y-3">
                <img
                  src={thumbnailUrl}
                  alt="縮圖預覽"
                  className="max-w-xs rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                  >
                    更換縮圖
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setThumbnailUrl('')}
                    disabled={uploadingThumbnail}
                  >
                    移除縮圖
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="thumbnail-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {uploadingThumbnail ? '上傳中...' : '點擊上傳縮圖'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">支援 JPG, PNG, GIF, WebP</p>
                  </div>
                </label>
              </div>
            )}
            <input
              ref={thumbnailInputRef}
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
            {uploadingThumbnail && (
              <p className="text-sm text-muted-foreground">上傳中...</p>
            )}
          </div>

          {/* 媒體檔案 */}
          <div className="space-y-2">
            <Label>媒體檔案</Label>
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border bg-gray-50 aspect-square">
                    {isVideo(url) ? (
                      <video
                        src={url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`媒體 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
            >
              {uploadingMedia ? '上傳中...' : '新增媒體'}
            </Button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaChange}
            />
            <p className="text-sm text-muted-foreground">支援圖片與影片（mp4, webm 等）</p>
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
              <p className="text-sm text-muted-foreground">數字越小越靠前</p>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublished: checked }))
                }
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                發布作品（公開顯示）
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {loading ? '處理中...' : mode === 'create' ? '創建作品' : '更新作品'}
        </Button>
      </div>
    </form>
  )
}
