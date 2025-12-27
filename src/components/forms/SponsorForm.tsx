'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SponsorFormProps {
  sponsor?: {
    id: string
    name: string
    logoUrl?: string | null
    tier?: string | null
    websiteUrl?: string | null
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    isContactPublic: boolean
    displayOrder: number
    exhibitionId: string
  }
  exhibitionId?: string
  mode: 'create' | 'edit'
}

export default function SponsorForm({ sponsor, exhibitionId, mode }: SponsorFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: sponsor?.name || '',
    logoUrl: sponsor?.logoUrl || '',
    tier: sponsor?.tier || '',
    websiteUrl: sponsor?.websiteUrl || '',
    contactName: sponsor?.contactName || '',
    contactEmail: sponsor?.contactEmail || '',
    contactPhone: sponsor?.contactPhone || '',
    isContactPublic: sponsor?.isContactPublic || false,
    displayOrder: sponsor?.displayOrder || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        logoUrl: formData.logoUrl || null,
        tier: formData.tier || null,
        websiteUrl: formData.websiteUrl || null,
        contactName: formData.contactName || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        isContactPublic: formData.isContactPublic,
        displayOrder: Number(formData.displayOrder),
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
        await apiClient.post('/sponsors', payload)
        toast({
          title: '創建成功',
          description: '贊助商已成功創建',
        })
        router.push('/admin/sponsors')
      } else {
        await apiClient.patch(`/sponsors/${sponsor?.id}`, payload)
        toast({
          title: '更新成功',
          description: '贊助商已成功更新',
        })
        router.push(`/admin/sponsors/${sponsor?.id}`)
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
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
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
              贊助商名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={255}
              placeholder="例：ABC 科技公司"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">贊助等級</Label>
            <Input
              id="tier"
              type="text"
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              maxLength={50}
              placeholder="例：鑽石贊助、金級贊助"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="websiteUrl">網站 URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

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
        </div>
      </div>

      {/* 聯絡資訊 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">聯絡資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">聯絡人姓名</Label>
            <Input
              id="contactName"
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              maxLength={100}
              placeholder="例：張三"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">聯絡人 Email</Label>
            <Input
              id="contactEmail"
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">聯絡人電話</Label>
            <Input
              id="contactPhone"
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              maxLength={50}
              placeholder="例：02-1234-5678"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isContactPublic"
              checked={formData.isContactPublic}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isContactPublic: checked }))}
            />
            <Label htmlFor="isContactPublic" className="cursor-pointer">
              公開聯絡資訊
            </Label>
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
          {loading ? '處理中...' : mode === 'create' ? '創建贊助商' : '更新贊助商'}
        </Button>
      </div>
    </form>
  )
}
