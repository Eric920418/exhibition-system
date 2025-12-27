import React from 'react'
import { useNode } from '@craftjs/core'

export interface ImageProps {
  src?: string
  alt?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  borderRadius?: number
}

export const Image = ({
  src = 'https://via.placeholder.com/400x300',
  alt = '圖片',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
}: ImageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        width,
        height: height === 'auto' ? undefined : height,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          borderRadius: `${borderRadius}px`,
          display: 'block',
        }}
      />
    </div>
  )
}

Image.craft = {
  displayName: '圖片',
  props: {
    src: 'https://via.placeholder.com/400x300',
    alt: '圖片',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: 0,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: () => import('./settings/ImageSettings').then(m => m.ImageSettings),
  },
}
