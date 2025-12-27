'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CanvasElement, Section } from './WixLikeEditor/types'

// 動態導入編輯器避免 SSR 問題
const WixLikeEditor = dynamic(() => import('./WixLikeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">載入編輯器中...</p>
      </div>
    </div>
  ),
})

interface HomepageEditorClientProps {
  initialState?: Record<string, any> | null
}

export default function HomepageEditorClient({ initialState }: HomepageEditorClientProps) {
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // 從 initialState 提取數據
  const initialSections = (initialState?.sections as Section[]) || []
  const initialElements = (initialState?.elements as CanvasElement[]) || []

  const handleSave = async (sections: Section[], elements: CanvasElement[]) => {
    setSaving(true)
    try {
      await apiClient.put('/system-settings/homepage_design', {
        sections,
        elements,
      })
      toast({
        title: '儲存成功',
        description: '首頁設計已成功儲存',
      })
    } catch (error: any) {
      toast({
        title: '儲存失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    window.open('/', '_blank')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 頂部導航 */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-6">
          <Link
            href="/admin"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">首頁編輯器</h1>
        
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            🌐 查看首頁
          </button>
        </div>
      </div>

      {/* Wix-Like 編輯器 */}
      <div className="flex-1 overflow-hidden">
        <WixLikeEditor
          initialSections={initialSections}
          initialElements={initialElements}
          onSave={handleSave}
          onPreview={handlePreview}
          saving={saving}
        />
      </div>
    </div>
  )
}
