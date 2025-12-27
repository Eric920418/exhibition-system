import { create } from 'zustand'
import type { CanvasElement, EditorState, Section } from './types'

interface EditorStore extends EditorState {
  // Section 操作
  addSection: (section?: Partial<Section>) => void
  updateSection: (id: string, updates: Partial<Section>) => void
  deleteSection: (id: string) => void
  selectSection: (id: string | null) => void
  moveSectionUp: (id: string) => void
  moveSectionDown: (id: string) => void
  duplicateSection: (id: string) => void

  // 元素操作
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>, sectionId: string) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  updateElementSize: (id: string, width: number, height: number) => void
  updateElementStyles: (id: string, styles: Partial<CanvasElement['styles']>) => void
  updateElementContent: (id: string, content: any) => void
  selectElement: (id: string | null) => void
  deleteElement: (id: string) => void
  getSelectedElement: () => CanvasElement | null
  getSelectedSection: () => Section | null
  getSectionElements: (sectionId: string) => CanvasElement[]
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void

  // 全局操作
  clearAll: () => void
  loadDesign: (sections: Section[], elements: CanvasElement[]) => void
  setViewportWidth: (width: number) => void
}

const createDefaultSection = (order: number): Section => ({
  id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: `區塊 ${order + 1}`,
  order,
  height: 'auto',
  minHeight: 400,
  background: {
    type: 'color',
    color: '#ffffff',
  },
  container: {
    width: 'boxed',
    maxWidth: 1200,
  },
  padding: {
    top: 60,
    bottom: 60,
    left: 20,
    right: 20,
  },
  styles: {},
})

export const useEditorStore = create<EditorStore>((set, get) => ({
  sections: [createDefaultSection(0)],
  elements: [],
  selectedElementId: null,
  selectedSectionId: null,
  viewportWidth: 1920,

  // ========== Section 操作 ==========

  addSection: (sectionData) => {
    const state = get()
    const order = state.sections.length
    const newSection = {
      ...createDefaultSection(order),
      ...sectionData,
      order: sectionData?.order ?? order,
    }
    set((state) => ({
      sections: [...state.sections, newSection],
      selectedSectionId: newSection.id,
    }))
  },

  updateSection: (id, updates) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      ),
    }))
  },

  deleteSection: (id) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== id),
      elements: state.elements.filter((el) => el.sectionId !== id),
      selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
    }))
  },

  selectSection: (id) => {
    set({ selectedSectionId: id, selectedElementId: null })
  },

  moveSectionUp: (id) => {
    set((state) => {
      const sections = [...state.sections]
      const index = sections.findIndex((s) => s.id === id)
      if (index > 0) {
        ;[sections[index], sections[index - 1]] = [sections[index - 1], sections[index]]
        sections.forEach((s, i) => (s.order = i))
      }
      return { sections }
    })
  },

  moveSectionDown: (id) => {
    set((state) => {
      const sections = [...state.sections]
      const index = sections.findIndex((s) => s.id === id)
      if (index < sections.length - 1) {
        ;[sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
        sections.forEach((s, i) => (s.order = i))
      }
      return { sections }
    })
  },

  duplicateSection: (id) => {
    const state = get()
    const section = state.sections.find((s) => s.id === id)
    if (!section) return

    const newSectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newSection = {
      ...section,
      id: newSectionId,
      name: `${section.name} (副本)`,
      order: state.sections.length,
    }

    const sectionElements = state.elements.filter((el) => el.sectionId === id)
    const newElements = sectionElements.map((el) => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sectionId: newSectionId,
    }))

    set((state) => ({
      sections: [...state.sections, newSection],
      elements: [...state.elements, ...newElements],
    }))
  },

  // ========== 元素操作 ==========

  addElement: (element, sectionId) => {
    const state = get()
    const sectionElements = state.elements.filter((el) => el.sectionId === sectionId)
    const maxZIndex = Math.max(...sectionElements.map((el) => el.zIndex), 0)

    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: maxZIndex + 1,
      sectionId,
    }
    set((state) => ({
      elements: [...state.elements, newElement],
      selectedElementId: newElement.id,
    }))
  },

  updateElementPosition: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, position: { x, y } } : el
      ),
    }))
  },

  updateElementSize: (id, width, height) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, size: { width, height } } : el
      ),
    }))
  },

  updateElementStyles: (id, styles) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el
      ),
    }))
  },

  updateElementContent: (id, content) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, content } : el
      ),
    }))
  },

  selectElement: (id) => {
    set({ selectedElementId: id, selectedSectionId: null })
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }))
  },

  getSelectedElement: () => {
    const state = get()
    return state.elements.find((el) => el.id === state.selectedElementId) || null
  },

  getSelectedSection: () => {
    const state = get()
    return state.sections.find((s) => s.id === state.selectedSectionId) || null
  },

  getSectionElements: (sectionId) => {
    const state = get()
    return state.elements.filter((el) => el.sectionId === sectionId)
  },

  bringToFront: (id) => {
    set((state) => {
      const element = state.elements.find((el) => el.id === id)
      if (!element) return state

      const sectionElements = state.elements.filter((el) => el.sectionId === element.sectionId)
      const maxZIndex = Math.max(...sectionElements.map((el) => el.zIndex), 0)

      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el
        ),
      }
    })
  },

  sendToBack: (id) => {
    set((state) => {
      const element = state.elements.find((el) => el.id === id)
      if (!element) return state

      const sectionElements = state.elements.filter((el) => el.sectionId === element.sectionId)
      const minZIndex = Math.min(...sectionElements.map((el) => el.zIndex), 0)

      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: minZIndex - 1 } : el
        ),
      }
    })
  },

  // ========== 全局操作 ==========

  clearAll: () => {
    set({
      sections: [createDefaultSection(0)],
      elements: [],
      selectedElementId: null,
      selectedSectionId: null,
    })
  },

  loadDesign: (sections, elements) => {
    set({
      sections: sections.length > 0 ? sections : [createDefaultSection(0)],
      elements,
      selectedElementId: null,
      selectedSectionId: null,
    })
  },

  setViewportWidth: (width) => {
    set({ viewportWidth: width })
  },
}))
