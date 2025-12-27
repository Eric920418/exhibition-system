export type ElementType = 'text' | 'image' | 'button' | 'container' | 'heading' | 'video' | 'icon' | 'shape'

export interface ElementStyles {
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

export interface CanvasElement {
  id: string
  type: ElementType
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
  sectionId: string // 元素所屬的 Section ID
}

export interface Section {
  id: string
  name: string
  order: number // Section 順序
  height: number | 'auto' // Section 高度，auto 表示根據內容自動調整
  minHeight?: number // 最小高度
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
    width: 'full' | 'boxed' // full: 全寬, boxed: 固定寬度居中
    maxWidth?: number // boxed 模式下的最大寬度，如 1200
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

export interface EditorState {
  sections: Section[]
  elements: CanvasElement[]
  selectedElementId: string | null
  selectedSectionId: string | null
  viewportWidth: number // 編輯器視口寬度
}
