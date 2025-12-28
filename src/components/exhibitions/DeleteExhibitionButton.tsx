'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface DeleteExhibitionButtonProps {
  exhibitionId: string
  exhibitionName: string
  hasTeams: boolean
  hasMembers: boolean
}

export default function DeleteExhibitionButton({
  exhibitionId,
  exhibitionName,
  hasTeams,
  hasMembers,
}: DeleteExhibitionButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await apiClient.delete(`/exhibitions/${exhibitionId}`)
      toast({
        title: '刪除成功',
        description: `展覽「${exhibitionName}」已成功刪除`,
      })
      router.push('/admin/exhibitions')
      router.refresh()
    } catch (error: any) {
      toast({
        title: '刪除失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const cannotDelete = hasTeams || hasMembers
  const reason = hasTeams && hasMembers
    ? '此展覽還有關聯的團隊和成員，無法刪除'
    : hasTeams
    ? '此展覽還有關聯的團隊，無法刪除'
    : '此展覽還有關聯的成員，無法刪除'

  if (cannotDelete) {
    return (
      <Button
        variant="destructive"
        disabled
        title={reason}
      >
        刪除展覽
      </Button>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">刪除展覽</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除展覽？</AlertDialogTitle>
          <AlertDialogDescription>
            您確定要刪除展覽「{exhibitionName}」嗎？此操作無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? '刪除中...' : '確認刪除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
