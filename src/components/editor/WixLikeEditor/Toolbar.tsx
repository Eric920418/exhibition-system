'use client'

import React from 'react'
import { useEditorStore } from './store'
import type { ElementType } from './types'

interface ToolbarProps {
  onSave: () => void
  onPreview: () => void
  saving?: boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onPreview, saving }) => {
  const { addElement, addSection, sections, selectedSectionId } = useEditorStore()

  // 獲取當前選中的 Section，如果沒有選中則使用第一個
  const currentSectionId = selectedSectionId || sections[0]?.id

  const defaultElements: Array<{
    type: ElementType
    label: string
    icon: React.ReactNode
    defaultProps: any
  }> = [
    {
      type: 'heading',
      label: '標題',
      icon: '🔤',
      defaultProps: {
        position: { x: 50, y: 50 },
        size: { width: 400, height: 60 },
        styles: {
          fontSize: 32,
          fontWeight: 700,
          color: '#1f2937',
        },
        content: '標題文字',
      },
    },
    {
      type: 'text',
      label: '文字',
      icon: '📝',
      defaultProps: {
        position: { x: 50, y: 120 },
        size: { width: 300, height: 40 },
        styles: {
          fontSize: 16,
          color: '#000000',
        },
        content: '雙擊編輯文字',
      },
    },
    {
      type: 'button',
      label: '按鈕',
      icon: '🔘',
      defaultProps: {
        position: { x: 50, y: 180 },
        size: { width: 150, height: 50 },
        styles: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          textAlign: 'center' as const,
        },
        content: '點擊按鈕',
      },
    },
    {
      type: 'image',
      label: '圖片',
      icon: '🖼️',
      defaultProps: {
        position: { x: 50, y: 250 },
        size: { width: 400, height: 300 },
        styles: {},
        content: 'https://via.placeholder.com/400x300',
      },
    },
    {
      type: 'container',
      label: '容器',
      icon: '📦',
      defaultProps: {
        position: { x: 50, y: 50 },
        size: { width: 300, height: 200 },
        styles: {
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
          padding: 20,
        },
        content: '容器區域',
      },
    },
  ]

  const handleAddElement = (template: typeof defaultElements[0]) => {
    if (!currentSectionId) {
      alert('請先添加區塊')
      return
    }
    addElement(
      {
        type: template.type,
        ...template.defaultProps,
      },
      currentSectionId
    )
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      {/* 左側：Section 和元素管理 */}
      <div className="flex items-center space-x-3">
        {/* 添加 Section */}
        <button
          onClick={() => addSection()}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm shadow-md"
          title="添加新區塊"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>添加區塊</span>
        </button>

        <div className="h-6 w-px bg-gray-300" />

        {/* 元素按鈕 */}
        <div className="flex items-center space-x-1">
          {defaultElements.map((element) => (
            <button
              key={element.type}
              onClick={() => handleAddElement(element)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-sm font-medium text-gray-700 hover:text-blue-700"
              title={`添加${element.label}`}
              disabled={!currentSectionId}
            >
              <span className="text-lg">{element.icon}</span>
              <span>{element.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 右側：預覽和儲存 */}
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-500">
          共 {sections.length} 個區塊
        </div>
        <div className="h-6 w-px bg-gray-300" />
        <button
          onClick={onPreview}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center space-x-2"
        >
          <span>👁️</span>
          <span>預覽</span>
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>💾</span>
          <span>{saving ? '儲存中...' : '儲存'}</span>
        </button>
      </div>
    </div>
  )
}
