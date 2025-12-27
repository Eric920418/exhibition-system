'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { presetTemplates, type PresetTemplate } from '@/lib/preset-templates'

interface TemplateCreateFormProps {
  exhibitionId: string
}

export default function TemplateCreateForm({ exhibitionId }: TemplateCreateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'name'>('select')
  const [selectedPreset, setSelectedPreset] = useState<PresetTemplate | null>(null)

  const [formData, setFormData] = useState({
    name: '',
  })

  const handlePresetSelect = (preset: PresetTemplate) => {
    setSelectedPreset(preset)
    setStep('name')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPreset) return

    setLoading(true)

    try {
      const response = await apiClient.post('/site-templates', {
        exhibitionId,
        name: formData.name,
        templateJson: selectedPreset.templateJson,
      }) as { id: string }

      toast({
        title: '創建成功',
        description: '模板已成功創建，正在跳轉到編輯器...',
      })

      router.push(`/admin/templates/${response.id}/editor`)
    } catch (error: any) {
      toast({
        title: '創建失敗',
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

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">選擇模板風格</h2>
          <p className="text-gray-600 mb-6">
            選擇一個預設模板快速開始，或從空白模板自由創作
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presetTemplates.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all"
              >
                {/* 圖示或縮圖區域 */}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center group-hover:from-blue-50 group-hover:to-purple-50 transition-colors">
                  <svg
                    className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {preset.name}
                </h3>
                <p className="text-sm text-gray-600">{preset.description}</p>

                {/* 分類標籤 */}
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    {preset.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 已選擇的模板預覽 */}
      {selectedPreset && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">已選擇模板</p>
              <p className="font-semibold text-blue-900">{selectedPreset.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep('select')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              重新選擇
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">模板資訊</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模板名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={255}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例：2024 畢業展網站"
          />
          <p className="mt-2 text-sm text-gray-500">
            為這個模板命名，方便日後管理
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">關於模板編輯器</h3>
            <p className="text-sm text-blue-700">
              創建後將進入可視化編輯器，您可以：
            </p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>從左側工具箱拖拉元件到畫布</li>
              <li>點擊元件以編輯屬性</li>
              <li>使用復原/重做功能</li>
              <li>儲存後可預覽或發布網站</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setStep('select')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          上一步
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? '創建中...' : '創建並進入編輯器'}
        </button>
      </div>
    </form>
  )
}
