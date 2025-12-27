'use client'

import React, { useRef, useEffect } from 'react'
import { useEditorStore } from './store'
import { EditableElement } from './EditableElement'
import type { Section } from './types'

interface SectionComponentProps {
  section: Section
}

export const SectionComponent: React.FC<SectionComponentProps> = ({ section }) => {
  const { getSectionElements, selectSection, selectedSectionId, viewportWidth } = useEditorStore()
  const sectionRef = useRef<HTMLDivElement>(null)
  const elements = getSectionElements(section.id)
  const isSelected = selectedSectionId === section.id

  // 計算 Section 的實際高度
  const calculateHeight = () => {
    if (section.height === 'auto') {
      // 根據元素計算最小高度
      if (elements.length === 0) {
        return section.minHeight || 400
      }
      const maxBottom = Math.max(
        ...elements.map((el) => el.position.y + el.size.height),
        section.minHeight || 400
      )
      return maxBottom + section.padding.bottom
    }
    return section.height
  }

  const sectionHeight = calculateHeight()

  // 計算背景樣式
  const getBackgroundStyle = (): React.CSSProperties => {
    const { background } = section

    switch (background.type) {
      case 'color':
        return { backgroundColor: background.color || '#ffffff' }

      case 'gradient':
        return { background: background.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }

      case 'image':
        return {
          backgroundImage: `url(${background.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }

      case 'video':
        // Video 會用 video 標籤處理
        return { backgroundColor: '#000000' }

      default:
        return { backgroundColor: '#ffffff' }
    }
  }

  return (
    <div
      ref={sectionRef}
      className="relative w-full"
      style={{
        ...getBackgroundStyle(),
        minHeight: section.minHeight,
        height: sectionHeight,
        borderTop: isSelected ? '3px solid #3b82f6' : '1px dashed #e5e7eb',
        borderBottom: isSelected ? '3px solid #3b82f6' : '1px dashed #e5e7eb',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === sectionRef.current?.children[0]) {
          selectSection(section.id)
        }
      }}
    >
      {/* 背景 Overlay */}
      {section.background.overlay?.enabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: section.background.overlay.color || '#000000',
            opacity: section.background.overlay.opacity || 0.5,
          }}
        />
      )}

      {/* 背景視頻 */}
      {section.background.type === 'video' && section.background.videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={section.background.videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Container */}
      <div
        className="relative mx-auto h-full"
        style={{
          width: section.container.width === 'full' ? '100%' : 'auto',
          maxWidth: section.container.width === 'boxed' ? section.container.maxWidth : '100%',
          paddingTop: section.padding.top,
          paddingBottom: section.padding.bottom,
          paddingLeft: section.padding.left,
          paddingRight: section.padding.right,
        }}
      >
        {/* Section 標籤 (選中時顯示) */}
        {isSelected && (
          <div className="absolute -top-8 left-0 bg-blue-600 text-white px-3 py-1 rounded-t-lg text-xs font-medium z-50">
            {section.name}
          </div>
        )}

        {/* 元素渲染 */}
        {elements.map((element) => (
          <EditableElement key={element.id} element={element} />
        ))}

        {/* 空 Section 提示 */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-sm">空白區塊 - 點擊上方按鈕添加元素</p>
            </div>
          </div>
        )}
      </div>

      {/* Section 邊界指示器 */}
      {isSelected && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 pointer-events-none" />
        </>
      )}
    </div>
  )
}
