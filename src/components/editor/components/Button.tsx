import React from 'react'
import { useNode } from '@craftjs/core'

export interface ButtonProps {
  text?: string
  backgroundColor?: string
  color?: string
  padding?: string
  borderRadius?: number
  href?: string
}

export const Button = ({
  text = '按鈕',
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  padding = '10px 20px',
  borderRadius = 6,
  href = '#',
}: ButtonProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <button
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        backgroundColor,
        color,
        padding,
        borderRadius: `${borderRadius}px`,
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 500,
      }}
      onClick={(e) => {
        e.preventDefault()
        if (href && href !== '#') {
          window.open(href, '_blank')
        }
      }}
    >
      {text}
    </button>
  )
}

Button.craft = {
  displayName: '按鈕',
  props: {
    text: '按鈕',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: 6,
    href: '#',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: () => import('./settings/ButtonSettings').then(m => m.ButtonSettings),
  },
}
