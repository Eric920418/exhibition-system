'use client'

import React, { useState } from 'react'
import { Editor, Frame, Element } from '@craftjs/core'
import { Container } from './components/Container'
import { Text } from './components/Text'
import { Button } from './components/Button'
import { Image } from './components/Image'
import { Toolbar } from './Toolbar'
import { Toolbox } from './Toolbox'
import { SettingsPanel } from './SettingsPanel'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import '@/styles/craftjs.css'

interface EditorClientProps {
  templateId: string
  templateName: string
  exhibitionSlug: string
  initialState?: Record<string, any>
  isPublished: boolean
}

export default function EditorClient({
  templateId,
  templateName,
  exhibitionSlug,
  initialState,
  isPublished: initialIsPublished,
}: EditorClientProps) {
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const { toast } = useToast()
  const router = useRouter()

  const handleSave = async (state: string) => {
    setSaving(true)
    try {
      await apiClient.patch(`/site-templates/${templateId}`, {
        templateJson: JSON.parse(state),
      })
      toast({
        title: '儲存成功',
        description: '模板已成功儲存',
      })
    } catch (error: any) {
      toast({
        title: '儲存失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    // 開啟前台預覽
    window.open(`/exhibitions/${exhibitionSlug}`, '_blank')
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await apiClient.post(`/site-templates/${templateId}/publish`, {
        isPublished: !isPublished,
      })
      setIsPublished(!isPublished)
      toast({
        title: isPublished ? '已取消發布' : '發布成功',
        description: isPublished
          ? '網站已下線，訪客將無法查看'
          : '網站已上線，訪客現在可以查看您的展覽',
      })
    } catch (error: any) {
      toast({
        title: '操作失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Editor
        resolver={{
          Container,
          Text,
          Button,
          Image,
        }}
        enabled={true}
        onRender={({ render }) => {
          if (typeof window !== 'undefined') {
            (window as any).craftState = render
          }
          return null
        }}
      >
        <Toolbar
          onSave={() => {
            const state = (window as any).craftState
            if (state) {
              handleSave(state)
            }
          }}
          onPreview={handlePreview}
          onPublish={handlePublish}
          isPublished={isPublished}
          saving={saving}
          publishing={publishing}
        />

        <div className="flex-1 flex overflow-hidden">
          <Toolbox />

          <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-lg min-h-[800px]">
              <Frame data={initialState}>
                <Element
                  is={Container}
                  padding={40}
                  background="#ffffff"
                  canvas
                >
                  {!initialState && (
                    <>
                      <Element is={Text} text="開始編輯您的展覽網站" fontSize={32} fontWeight={700} />
                      <Element is={Text} text="將左側的元件拖拉到此處來建立您的頁面" fontSize={16} color="#666666" />
                    </>
                  )}
                </Element>
              </Frame>
            </div>
          </div>

          <SettingsPanel />
        </div>
      </Editor>
    </div>
  )
}
