'use client'

import React from 'react'
import { useEditorStore } from './store'

export const SectionsPanel: React.FC = () => {
  const {
    sections,
    selectedSectionId,
    selectSection,
    addSection,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    duplicateSection,
    getSectionElements,
  } = useEditorStore()

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">區塊管理</h3>
          <button
            onClick={() => addSection()}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="添加區塊"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 區塊列表 */}
        <div className="space-y-2">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const elementCount = getSectionElements(section.id).length
              const isSelected = selectedSectionId === section.id

              return (
                <div
                  key={section.id}
                  className={`
                    p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => selectSection(section.id)}
                >
                  {/* Section 標題 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {section.name}
                      </span>
                    </div>
                  </div>

                  {/* Section 資訊 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{elementCount} 個元素</span>
                    <span>{section.container.width === 'full' ? '全寬' : '居中'}</span>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSectionUp(section.id)
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSectionDown(section.id)
                      }}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateSection(section.id)
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="複製"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`確定要刪除「${section.name}」嗎？\n此操作將同時刪除區塊內的所有元素。`)) {
                          deleteSection(section.id)
                        }
                      }}
                      disabled={sections.length === 1}
                      className="p-1 hover:bg-red-100 rounded text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="刪除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        {/* 提示 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 leading-relaxed">
            💡 提示：點擊區塊卡片可以選中並編輯該區塊的背景、高度等屬性
          </p>
        </div>
      </div>
    </div>
  )
}
