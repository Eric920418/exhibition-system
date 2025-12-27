'use client'

import React from 'react'
import { Editor, Frame, Element } from '@craftjs/core'
import { Container } from './components/Container'
import { Text } from './components/Text'
import { Button } from './components/Button'
import { Image } from './components/Image'

interface TemplateRendererProps {
  templateJson: Record<string, any>
}

/**
 * 只讀模式的模板渲染器
 * 用於前台展示已發布的模板內容
 */
export default function TemplateRenderer({ templateJson }: TemplateRendererProps) {
  return (
    <Editor
      resolver={{
        Container,
        Text,
        Button,
        Image,
      }}
      enabled={false} // 禁用編輯模式
    >
      <Frame data={templateJson}>
        <Element
          is={Container}
          padding={40}
          background="#ffffff"
          canvas
        />
      </Frame>
    </Editor>
  )
}
