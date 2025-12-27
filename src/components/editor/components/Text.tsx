import React, { useState } from 'react'
import { useNode } from '@craftjs/core'
import ContentEditable from 'react-contenteditable'

export interface TextProps {
  text?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

export const Text = ({
  text = '請輸入文字',
  fontSize = 16,
  fontWeight = 400,
  color = '#000000',
  textAlign = 'left',
}: TextProps) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  const [editable, setEditable] = useState(false)

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      onClick={() => selected && setEditable(true)}
      onBlur={() => setEditable(false)}
    >
      <ContentEditable
        html={text}
        disabled={!editable}
        onChange={(e) => {
          setProp((props: TextProps) => {
            props.text = e.target.value
          })
        }}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color,
          textAlign,
          outline: 'none',
          cursor: editable ? 'text' : 'pointer',
        }}
      />
    </div>
  )
}

Text.craft = {
  displayName: '文字',
  props: {
    text: '請輸入文字',
    fontSize: 16,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'left',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  related: {
    settings: () => import('./settings/TextSettings').then(m => m.TextSettings),
  },
}
