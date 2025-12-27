import React from 'react'
import { useNode } from '@craftjs/core'

export interface ContainerProps {
  background?: string
  padding?: number
  children?: React.ReactNode
  className?: string
}

export const Container = ({
  background = '#ffffff',
  padding = 20,
  children,
  className = '',
}: ContainerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        background,
        padding: `${padding}px`,
        minHeight: '100px',
      }}
      className={`${className} transition-all`}
    >
      {children}
    </div>
  )
}

Container.craft = {
  displayName: '容器',
  props: {
    background: '#ffffff',
    padding: 20,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: () => import('./settings/ContainerSettings').then(m => m.ContainerSettings),
  },
}
