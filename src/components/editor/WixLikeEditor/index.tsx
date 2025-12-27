'use client'

import React, { useEffect } from 'react'
import { Toolbar } from './Toolbar'
import { Canvas } from './Canvas'
import { PropertiesPanel } from './PropertiesPanel'
import { SectionsPanel } from './SectionsPanel'
import { useEditorStore } from './store'
import type { CanvasElement, Section } from './types'

interface WixLikeEditorProps {
  initialSections?: Section[]
  initialElements?: CanvasElement[]
  onSave: (sections: Section[], elements: CanvasElement[]) => void
  onPreview: () => void
  saving?: boolean
}

export const WixLikeEditor: React.FC<WixLikeEditorProps> = ({
  initialSections,
  initialElements,
  onSave,
  onPreview,
  saving,
}) => {
  const { sections, elements, loadDesign } = useEditorStore()

  // 載入初始設計（組件掛載時執行）
  useEffect(() => {
    // 總是載入最新的 initialSections 和 initialElements
    loadDesign(initialSections || [], initialElements || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = () => {
    onSave(sections, elements)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 工具欄 */}
      <Toolbar onSave={handleSave} onPreview={onPreview} saving={saving} />

      {/* 主要編輯區域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：Sections 管理面板 */}
        <SectionsPanel />

        {/* 中間：畫布區域 */}
        <div className="flex-1 overflow-auto">
          <Canvas />
        </div>

        {/* 右側：屬性面板 */}
        <PropertiesPanel />
      </div>

      {/* 快捷鍵提示 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span>💡 像 Wix 一樣自由拖放</span>
          <span>•</span>
          <span>點擊區塊編輯背景和佈局</span>
          <span>•</span>
          <span>拖動元素移動位置</span>
          <span>•</span>
          <span>Delete 刪除元素</span>
        </div>
        <div className="text-gray-400">
          無限延伸畫布 | 全寬背景支援
        </div>
      </div>
    </div>
  )
}

export default WixLikeEditor
