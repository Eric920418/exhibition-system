'use client'

import React from 'react'
import { useEditorStore } from './store'
import { SectionComponent } from './SectionComponent'

export const Canvas: React.FC = () => {
  const { sections, selectSection, selectElement } = useEditorStore()

  return (
    <div
      className="w-full bg-gray-100 min-h-screen"
      onClick={(e) => {
        // 點擊空白處取消所有選擇
        if (e.target === e.currentTarget) {
          selectElement(null)
          selectSection(null)
        }
      }}
    >
      {/* 渲染所有 Sections */}
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionComponent key={section.id} section={section} />
        ))}

      {/* 空頁面提示 */}
      {sections.length === 0 && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-400">
            <svg
              className="w-24 h-24 mx-auto mb-6 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-2xl font-semibold mb-2">開始設計您的頁面</h3>
            <p className="text-lg">點擊左側「+ 添加區塊」開始</p>
          </div>
        </div>
      )}
    </div>
  )
}
