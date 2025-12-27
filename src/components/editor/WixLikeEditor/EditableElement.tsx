'use client'

import React from 'react'
import { Rnd } from 'react-rnd'
import type { CanvasElement } from './types'
import { useEditorStore } from './store'

interface EditableElementProps {
  element: CanvasElement
}

export const EditableElement: React.FC<EditableElementProps> = ({ element }) => {
  const { updateElementPosition, updateElementSize, selectElement, selectedElementId } = useEditorStore()
  const isSelected = selectedElementId === element.id

  const renderContent = () => {
    const baseStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      ...element.styles,
    }

    switch (element.type) {
      case 'text':
        return (
          <p style={{ ...baseStyles, margin: 0, overflow: 'hidden' }}>
            {element.content || '文字'}
          </p>
        )

      case 'heading':
        return (
          <h2 style={{ ...baseStyles, margin: 0, overflow: 'hidden' }}>
            {element.content || '標題'}
          </h2>
        )

      case 'button':
        return (
          <button
            style={{
              ...baseStyles,
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
            }}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
          >
            {element.content || '按鈕'}
          </button>
        )

      case 'image':
        return (
          <img
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
        return <div style={baseStyles}>{element.content}</div>
    }
  }

  return (
    <Rnd
      position={{ x: element.position.x, y: element.position.y }}
      size={{ width: element.size.width, height: element.size.height }}
      onDragStop={(e, d) => {
        updateElementPosition(element.id, d.x, d.y)
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateElementSize(
          element.id,
          parseInt(ref.style.width),
          parseInt(ref.style.height)
        )
        updateElementPosition(element.id, position.x, position.y)
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        selectElement(element.id)
      }}
      bounds="parent"
      style={{
        zIndex: element.zIndex,
        border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
        cursor: 'move',
      }}
      enableResizing={isSelected}
      disableDragging={!isSelected}
      resizeHandleStyles={{
        bottomRight: {
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          right: '-6px',
          bottom: '-6px',
        },
        bottomLeft: {
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          left: '-6px',
          bottom: '-6px',
        },
        topRight: {
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          right: '-6px',
          top: '-6px',
        },
        topLeft: {
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          left: '-6px',
          top: '-6px',
        },
      }}
    >
      {renderContent()}
    </Rnd>
  )
}
