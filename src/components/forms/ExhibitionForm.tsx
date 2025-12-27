'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ExhibitionFormProps {
  exhibition?: {
    id: string
    name: string
    year: number
    slug: string
    description?: string | null
    startDate: string | Date
    endDate: string | Date
    status: string
    posterUrl?: string | null
  }
  mode: 'create' | 'edit'
}

export default function ExhibitionForm({ exhibition, mode }: ExhibitionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // 格式化日期為 YYYY-MM-DD
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    name: exhibition?.name || '',
    year: exhibition?.year || new Date().getFullYear(),
    slug: exhibition?.slug || '',
    description: exhibition?.description || '',
    startDate: exhibition ? formatDate(exhibition.startDate) : '',
    endDate: exhibition ? formatDate(exhibition.endDate) : '',
    status: exhibition?.status || 'DRAFT',
    posterUrl: exhibition?.posterUrl || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 驗證日期
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast({
          title: '日期錯誤',
          description: '結束日期必須晚於開始日期',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const payload = {
        ...formData,
        year: Number(formData.year),
        // 將日期轉換為 ISO 8601 格式
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }

      console.log(`[ExhibitionForm] ${mode} payload:`, payload)
      console.log(`[ExhibitionForm] payload.status = "${payload.status}"`)

      if (mode === 'create') {
        const result = await apiClient.post('/exhibitions', payload)
        console.log('[ExhibitionForm] Create success:', result)
        toast({
          title: '創建成功',
          description: '展覽已成功創建',
        })
        router.push('/admin/exhibitions')
      } else {
        console.log(`[ExhibitionForm] Updating exhibition ${exhibition?.id}`)
        await apiClient.patch(`/exhibitions/${exhibition?.id}`, payload)
        toast({
          title: '更新成功',
          description: '展覽已成功更新',
        })
        // 使用 router.refresh() 強制重新驗證快取，然後再跳轉
        router.refresh()
        setTimeout(() => {
          router.push(`/admin/exhibitions/${exhibition?.id}`)
        }, 100)
      }
    } catch (error: any) {
      console.error(`[ExhibitionForm] ${mode} error:`, error)
      console.error('[ExhibitionForm] Error details:', {
        message: error.message,
        status: error.status,
        details: error.details,
        stack: error.stack,
      })

      toast({
        title: mode === 'create' ? '創建失敗' : '更新失敗',
        description: error.details
          ? `${error.message}: ${JSON.stringify(error.details)}`
          : error.message || '操作失敗,請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 自動生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      // 只在創建模式下自動生成 slug
      ...(mode === 'create' && {
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim(),
      }),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="name">
              展覽名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              required
              placeholder="例：2024 畢業展覽"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">
              年份 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="2000"
              max="2100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              pattern="[a-z0-9\-]+"
              placeholder="例：2024-graduation"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              只能包含小寫字母、數字和連字符
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              開始日期 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">
              結束日期 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              狀態 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                console.log('[ExhibitionForm] Status changed from', formData.status, 'to', value)
                setFormData((prev) => {
                  const updated = { ...prev, status: value }
                  console.log('[ExhibitionForm] Updated formData:', updated)
                  return updated
                })
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="PUBLISHED">已發布</SelectItem>
                <SelectItem value="ARCHIVED">已歸檔</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              當前狀態：{formData.status}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posterUrl">海報圖片 URL</Label>
            <Input
              id="posterUrl"
              type="url"
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="展覽的詳細描述..."
            />
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
          {loading ? '處理中...' : mode === 'create' ? '創建展覽' : '更新展覽'}
        </Button>
      </div>
    </form>
  )
}
