'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface VenueFormProps {
  venue?: {
    id: string
    name: string
    address?: string | null
    capacity?: number | null
    floorPlanUrl?: string | null
    exhibitionId: string
  }
  exhibitionId?: string
  mode: 'create' | 'edit'
}

export default function VenueForm({ venue, exhibitionId, mode }: VenueFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: venue?.name || '',
    address: venue?.address || '',
    capacity: venue?.capacity || '',
    floorPlanUrl: venue?.floorPlanUrl || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        address: formData.address || null,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        floorPlanUrl: formData.floorPlanUrl || null,
      }

      if (mode === 'create') {
        if (!exhibitionId) {
          toast({
            title: '錯誤',
            description: '缺少展覽 ID',
            variant: 'destructive',
          })
          return
        }
        payload.exhibitionId = exhibitionId
        await apiClient.post('/venues', payload)
        toast({
          title: '創建成功',
          description: '場地已成功創建',
        })
        router.push('/admin/venues')
      } else {
        await apiClient.patch(`/venues/${venue?.id}`, payload)
        toast({
          title: '更新成功',
          description: '場地已成功更新',
        })
        router.push(`/admin/venues/${venue?.id}`)
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
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="name">
              場地名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={255}
              placeholder="例：展覽廳 A"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="例：台北市信義區基隆路二段 1 號"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">容納人數</Label>
            <Input
              id="capacity"
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              placeholder="例：500"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="floorPlanUrl">平面圖 URL</Label>
            <Input
              id="floorPlanUrl"
              type="url"
              name="floorPlanUrl"
              value={formData.floorPlanUrl}
              onChange={handleChange}
              placeholder="https://example.com/floor-plan.png"
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
          {loading ? '處理中...' : mode === 'create' ? '創建場地' : '更新場地'}
        </Button>
      </div>
    </form>
  )
}
