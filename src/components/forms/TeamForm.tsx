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

interface TeamFormProps {
  team?: {
    id: string
    name: string
    slug: string
    leaderId?: string | null
    description?: string | null
    displayOrder: number
    exhibitionId: string
  }
  exhibitionId?: string
  leaders?: { id: string; name: string; email: string }[]
  mode: 'create' | 'edit'
}

export default function TeamForm({ team, exhibitionId, leaders = [], mode }: TeamFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: team?.name || '',
    slug: team?.slug || '',
    leaderId: team?.leaderId || '',
    description: team?.description || '',
    displayOrder: team?.displayOrder || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        leaderId: formData.leaderId || null,
        description: formData.description || null,
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
        await apiClient.post('/teams', payload)
        toast({
          title: '創建成功',
          description: '團隊已成功創建',
        })
        router.push('/admin/teams')
      } else {
        await apiClient.patch(`/teams/${team?.id}`, payload)
        toast({
          title: '更新成功',
          description: '團隊已成功更新',
        })
        router.push(`/admin/teams/${team?.id}`)
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
              團隊名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              required
              placeholder="例：互動設計組"
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
              pattern="[a-z0-9-]+"
              placeholder="例：interactive-design"
            />
            <p className="text-sm text-muted-foreground">
              只能包含小寫字母、數字和連字符
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaderId">組長</Label>
            <Select
              value={formData.leaderId || '__none__'}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, leaderId: value === '__none__' ? '' : value }))}
            >
              <SelectTrigger id="leaderId">
                <SelectValue placeholder="未指定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未指定</SelectItem>
                {leaders.map((leader) => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.name} ({leader.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-sm text-muted-foreground">
              數字越小越靠前
            </p>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="團隊的簡介或說明..."
            />
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
          {loading ? '處理中...' : mode === 'create' ? '創建團隊' : '更新團隊'}
        </Button>
      </div>
    </form>
  )
}
