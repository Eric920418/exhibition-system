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

interface DeleteArtworkButtonProps {
  artworkId: string
  artworkTitle: string
}

export default function DeleteArtworkButton({
  artworkId,
  artworkTitle,
}: DeleteArtworkButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await apiClient.delete(`/artworks/${artworkId}`)
      toast({
        title: '刪除成功',
        description: `作品「${artworkTitle}」已成功刪除`,
      })
      router.push('/admin/artworks')
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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">刪除作品</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除作品？</AlertDialogTitle>
          <AlertDialogDescription>
            您確定要刪除作品「{artworkTitle}」嗎？此操作無法復原，相關的版本歷史也會一併刪除。
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
