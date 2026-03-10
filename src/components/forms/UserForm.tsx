'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface UserFormProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    avatarUrl?: string | null
  }
  mode: 'create' | 'edit'
  isSuperAdmin?: boolean
  currentUserId?: string
}

export default function UserForm({ user, mode, isSuperAdmin, currentUserId }: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 是否可以删除：超级管理员 + 编辑模式 + 不是自己
  const canDelete = isSuperAdmin && mode === 'edit' && user?.id !== currentUserId

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'CURATOR',
    isActive: user?.isActive ?? true,
    avatarUrl: user?.avatarUrl || '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        avatarUrl: formData.avatarUrl || null,
      }

      // 僅在創建模式或提供密碼時包含密碼
      if (mode === 'create') {
        if (!formData.password) {
          toast({
            title: '密碼不能為空',
            description: '請輸入用戶密碼',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
        payload.password = formData.password
      } else if (formData.password) {
        payload.password = formData.password
      }

      if (mode === 'create') {
        await apiClient.post('/users', payload)
        toast({
          title: '創建成功',
          description: '用戶已成功創建',
        })
        router.push('/admin/users')
      } else {
        await apiClient.patch(`/users/${user?.id}`, payload)
        toast({
          title: '更新成功',
          description: '用戶已成功更新',
        })
        router.push(`/admin/users/${user?.id}`)
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleDelete = async () => {
    if (!user?.id) return

    setDeleting(true)
    try {
      await apiClient.delete(`/users/${user.id}`)
      toast({
        title: '刪除成功',
        description: '用戶已成功刪除',
      })
      router.push('/admin/users')
    } catch (error: any) {
      toast({
        title: '刪除失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
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
              placeholder="請輸入姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              電子郵件 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              角色 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="選擇角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CURATOR">畢籌人員</SelectItem>
                <SelectItem value="TEAM_LEADER">組長</SelectItem>
                <SelectItem value="SUPER_ADMIN">超級管理員</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">頭像 URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              密碼 {mode === 'create' && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={mode === 'create'}
              minLength={6}
              placeholder={
                mode === 'create' ? '至少 6 個字元' : '留空表示不修改密碼'
              }
            />
            {mode === 'edit' && (
              <p className="mt-1 text-sm text-muted-foreground">
                留空表示不修改密碼
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              啟用用戶
            </Label>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
        {/* 刪除按鈕 - 僅超級管理員可見 */}
        <div>
          {canDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
              className="w-full sm:w-auto"
            >
              刪除用戶
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading || deleting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={loading || deleting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? '處理中...' : mode === 'create' ? '創建用戶' : '更新用戶'}
          </Button>
        </div>
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">確認刪除</h3>
            <p className="text-gray-600 mb-4">
              確定要刪除用戶 <strong>{user?.name}</strong> ({user?.email}) 嗎？此操作無法撤銷。
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
