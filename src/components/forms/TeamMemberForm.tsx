'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface TeamMemberFormProps {
  member?: {
    id: string
    name: string
    role?: string | null
    displayOrder: number
    teamId: string
  }
  teamId: string
  teamName: string
  mode: 'create' | 'edit'
}

export default function TeamMemberForm({ member, teamId, teamName, mode }: TeamMemberFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: member?.name || '',
    role: member?.role || '',
    displayOrder: member?.displayOrder || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        role: formData.role || null,
        displayOrder: Number(formData.displayOrder),
        ...(mode === 'create' && { teamId }),
      }

      if (mode === 'create') {
        await apiClient.post('/team-members', payload)
        toast({
          title: '添加成功',
          description: '團隊成員已成功添加',
        })
      } else {
        await apiClient.patch(`/team-members/${member?.id}`, payload)
        toast({
          title: '更新成功',
          description: '團隊成員已成功更新',
        })
      }
      router.push(`/admin/teams/${teamId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: mode === 'create' ? '添加失敗' : '更新失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">成員信息</h2>
        <p className="text-sm text-gray-500 mb-4">團隊：{teamName}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              姓名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="請輸入成員姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">角色/職位</Label>
            <Input
              id="role"
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="例：程式設計、美術設計"
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
          {loading ? '處理中...' : mode === 'create' ? '添加成員' : '更新成員'}
        </Button>
      </div>
    </form>
  )
}
