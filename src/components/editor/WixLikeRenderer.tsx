'use client'

import React from 'react'

interface ElementStyles {
  backgroundColor?: string
  color?: string
  fontSize?: number
  fontWeight?: number | string
  textAlign?: 'left' | 'center' | 'right'
  padding?: number
  borderRadius?: number
  border?: string
  boxShadow?: string
  opacity?: number
  [key: string]: any
}

interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'button' | 'container' | 'heading'
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  styles: ElementStyles
  content: any
  zIndex: number
  sectionId: string
}

interface Section {
  id: string
  name: string
  order: number
  height: number | 'auto'
  minHeight?: number
  background: {
    type: 'color' | 'gradient' | 'image' | 'video'
    color?: string
    gradient?: string
    imageUrl?: string
    videoUrl?: string
    overlay?: {
      enabled: boolean
      color: string
      opacity: number
    }
  }
  container: {
    width: 'full' | 'boxed'
    maxWidth?: number
  }
  padding: {
    top: number
    bottom: number
    left: number
    right: number
  }
  styles: {
    [key: string]: any
  }
}

interface WixLikeRendererProps {
  sections: Section[]
  elements: CanvasElement[]
}

export const WixLikeRenderer: React.FC<WixLikeRendererProps> = ({
  sections,
  elements,
}) => {
  const renderElement = (element: CanvasElement) => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      zIndex: element.zIndex,
      ...element.styles,
    }

    switch (element.type) {
      case 'text':
        return (
          <p key={element.id} style={{ ...baseStyles, margin: 0 }}>
            {element.content || '文字'}
          </p>
        )

      case 'heading':
        return (
          <h2 key={element.id} style={{ ...baseStyles, margin: 0 }}>
            {element.content || '標題'}
          </h2>
        )

      case 'button':
        return (
          <button
            key={element.id}
            style={{
              ...baseStyles,
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
            }}
          >
            {element.content || '按鈕'}
          </button>
        )

      case 'image':
        return (
          <img
            key={element.id}
            src={element.content || 'https://via.placeholder.com/400x300'}
            alt="元素圖片"
            style={{
              ...baseStyles,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )

      case 'container':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {element.content || '容器'}
          </div>
        )

      default:
        return (
          <div key={element.id} style={baseStyles}>
            {element.content}
          </div>
        )
    }
  }

  const getBackgroundStyle = (background: Section['background']): React.CSSProperties => {
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
        return { backgroundColor: '#000000' }

      default:
        return { backgroundColor: '#ffffff' }
    }
  }

  const calculateSectionHeight = (section: Section, sectionElements: CanvasElement[]) => {
    if (section.height === 'auto') {
      if (sectionElements.length === 0) {
        return section.minHeight || 400
      }
      const maxBottom = Math.max(
        ...sectionElements.map((el) => el.position.y + el.size.height),
        section.minHeight || 400
      )
      return maxBottom + section.padding.bottom
    }
    return section.height
  }

  return (
    <div className="w-full">
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const sectionElements = elements.filter((el) => el.sectionId === section.id)
          const sectionHeight = calculateSectionHeight(section, sectionElements)

          return (
            <div
              key={section.id}
              className="relative w-full"
              style={{
                ...getBackgroundStyle(section.background),
                minHeight: section.minHeight,
                height: sectionHeight,
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
                {/* 渲染元素 */}
                {sectionElements.map((element) => renderElement(element))}
              </div>
            </div>
          )
        })}
    </div>
  )
}

export default WixLikeRenderer
