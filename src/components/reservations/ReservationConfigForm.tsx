'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface ReservationConfigFormProps {
  teamId: string
  teamName: string
  config?: {
    id: string
    slotDurationMinutes: number
    breakDurationMinutes: number
    maxConcurrentCapacity: number
    dailyStartTime: string
    dailyEndTime: string
    isActive: boolean
  }
  mode: 'create' | 'edit'
}

export default function ReservationConfigForm({
  teamId,
  teamName,
  config,
  mode,
}: ReservationConfigFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    slotDurationMinutes: config?.slotDurationMinutes ?? 15,
    breakDurationMinutes: config?.breakDurationMinutes ?? 5,
    maxConcurrentCapacity: config?.maxConcurrentCapacity ?? 1,
    dailyStartTime: config?.dailyStartTime ?? '09:00',
    dailyEndTime: config?.dailyEndTime ?? '17:00',
    isActive: config?.isActive ?? true,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        ...(mode === 'create' && { teamId }),
      }

      if (mode === 'create') {
        await apiClient.post('/reservations/config', payload)
        toast({
          title: '創建成功',
          description: `已為「${teamName}」創建預約設定`,
        })
      } else {
        await apiClient.patch(`/reservations/config/${teamId}`, payload)
        toast({
          title: '更新成功',
          description: '預約設定已更新',
        })
      }

      router.push('/admin/reservations/settings')
      router.refresh()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? '創建失敗' : '更新失敗',
        description: error.message || '發生未知錯誤',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 組別資訊 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500">設定組別</p>
        <p className="text-lg font-medium">{teamName}</p>
      </div>

      {/* 時段設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="slotDurationMinutes">
            每時段長度（分鐘） <span className="text-red-500">*</span>
          </Label>
          <Input
            id="slotDurationMinutes"
            name="slotDurationMinutes"
            type="number"
            min={5}
            max={120}
            value={formData.slotDurationMinutes}
            onChange={handleChange}
            required
          />
          <p className="text-sm text-muted-foreground">
            每位訪客的服務時間，建議 10-30 分鐘
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breakDurationMinutes">
            時段間休息時間（分鐘）
          </Label>
          <Input
            id="breakDurationMinutes"
            name="breakDurationMinutes"
            type="number"
            min={0}
            max={60}
            value={formData.breakDurationMinutes}
            onChange={handleChange}
          />
          <p className="text-sm text-muted-foreground">
            兩個時段之間的緩衝時間
          </p>
        </div>
      </div>

      {/* 容量設定 */}
      <div className="space-y-2">
        <Label htmlFor="maxConcurrentCapacity">
          同時服務容量 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="maxConcurrentCapacity"
          name="maxConcurrentCapacity"
          type="number"
          min={1}
          max={10}
          value={formData.maxConcurrentCapacity}
          onChange={handleChange}
          required
        />
        <p className="text-sm text-muted-foreground">
          可同時服務的訪客人數（例如：有 2 個導覽員則填 2）
        </p>
      </div>

      {/* 營業時間 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="dailyStartTime">
            每日開始時間 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dailyStartTime"
            name="dailyStartTime"
            type="time"
            value={formData.dailyStartTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dailyEndTime">
            每日結束時間 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dailyEndTime"
            name="dailyEndTime"
            type="time"
            value={formData.dailyEndTime}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* 啟用狀態 */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isActive: checked }))
          }
        />
        <div>
          <Label htmlFor="isActive" className="cursor-pointer">
            啟用預約功能
          </Label>
          <p className="text-sm text-muted-foreground">
            關閉後觀眾將無法預約此組別
          </p>
        </div>
      </div>

      {/* 預覽資訊 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">設定預覽</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            服務時間：{formData.dailyStartTime} - {formData.dailyEndTime}
          </li>
          <li>
            每位訪客：{formData.slotDurationMinutes} 分鐘
            {formData.breakDurationMinutes > 0 &&
              `（+ ${formData.breakDurationMinutes} 分鐘休息）`}
          </li>
          <li>同時服務：{formData.maxConcurrentCapacity} 人</li>
          <li>
            預計每小時可服務：
            {Math.floor(
              (60 /
                (formData.slotDurationMinutes +
                  formData.breakDurationMinutes)) *
                formData.maxConcurrentCapacity
            )}{' '}
            人
          </li>
        </ul>
      </div>

      {/* 按鈕 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? '處理中...'
            : mode === 'create'
            ? '創建設定'
            : '更新設定'}
        </Button>
      </div>
    </form>
  )
}
