'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface DocumentActionsProps {
  documentId: string
}

export default function DocumentActions({ documentId }: DocumentActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await apiClient.delete(`/documents/${documentId}`)
      toast({
        title: '刪除成功',
        description: '文件已成功刪除',
      })
      router.push('/admin/documents')
    } catch (error: any) {
      toast({
        title: '刪除失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
      >
        刪除文件
      </button>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">確認刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要刪除此文件嗎？此操作無法撤銷。
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                注意：這只會刪除資料庫記錄，不會刪除 MinIO 中的實際檔案。
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
