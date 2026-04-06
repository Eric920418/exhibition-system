'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadFormProps {
  exhibitionId: string
}

const documentTypeLabels: Record<string, string> = {
  PROPOSAL: '企劃書',
  DESIGN: '設計稿',
  PLAN: '計劃書',
  OTHER: '其他',
}

export default function DocumentUploadForm({ exhibitionId }: DocumentUploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'OTHER' as 'PROPOSAL' | 'DESIGN' | 'PLAN' | 'OTHER',
    version: 1,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // 如果標題為空，自動使用檔案名稱（去除副檔名）
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '')
        setFormData((prev) => ({ ...prev, title: fileName }))
      }
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'version' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: '錯誤',
        description: '請選擇要上傳的檔案',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setUploading(true)

    try {
      // 步驟 1: 上傳檔案到 Vercel Blob
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      setUploading(false)

      // 步驟 2: 創建文件記錄
      await apiClient.post('/documents', {
        exhibitionId,
        type: formData.type,
        title: formData.title,
        fileUrl: blob.url,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        version: formData.version,
      })

      toast({
        title: '上傳成功',
        description: '文件已成功上傳',
      })

      router.push('/admin/documents')
    } catch (error: any) {
      toast({
        title: uploading ? '上傳失敗' : '創建記錄失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">文件信息</h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇檔案 <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              支援格式：PDF, Word, Excel, PowerPoint, ZIP, RAR
            </p>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-700">
                已選擇：{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：2024 畢業展企劃書"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件類型 <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                版本號
              </label>
              <input
                type="number"
                name="version"
                value={formData.version}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 上傳進度提示 */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-blue-600 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-blue-800">正在上傳檔案...</p>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? (uploading ? '上傳中...' : '處理中...') : '上傳文件'}
        </button>
      </div>
    </form>
  )
}
