'use client'

import React from 'react'
import { useEditorStore } from './store'

export const PropertiesPanel: React.FC = () => {
  const {
    getSelectedElement,
    getSelectedSection,
    updateElementContent,
    updateElementStyles,
    updateSection,
    deleteElement,
    bringToFront,
    sendToBack,
  } = useEditorStore()

  const selectedElement = getSelectedElement()
  const selectedSection = getSelectedSection()

  // 如果選中了元素，顯示元素屬性
  if (selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">元素屬性</h3>

          {/* 元素類型 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">類型</p>
            <p className="text-sm text-blue-800 capitalize">{selectedElement.type}</p>
          </div>

          {/* 內容編輯 */}
          {(selectedElement.type === 'text' ||
            selectedElement.type === 'heading' ||
            selectedElement.type === 'button' ||
            selectedElement.type === 'container') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">內容</label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => updateElementContent(selectedElement.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
            </div>
          )}

          {/* 圖片 URL */}
          {selectedElement.type === 'image' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">圖片 URL</label>
              <input
                type="text"
                value={selectedElement.content}
                onChange={(e) => updateElementContent(selectedElement.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {/* 樣式設定 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 mt-6 mb-3">樣式</h4>

            {/* 背景顏色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景顏色</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={selectedElement.styles.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    updateElementStyles(selectedElement.id, { backgroundColor: e.target.value })
                  }
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.styles.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    updateElementStyles(selectedElement.id, { backgroundColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* 文字顏色 */}
            {(selectedElement.type === 'text' ||
              selectedElement.type === 'heading' ||
              selectedElement.type === 'button' ||
              selectedElement.type === 'container') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">文字顏色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.styles.color || '#000000'}
                    onChange={(e) =>
                      updateElementStyles(selectedElement.id, { color: e.target.value })
                    }
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.styles.color || '#000000'}
                    onChange={(e) =>
                      updateElementStyles(selectedElement.id, { color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 字體大小 */}
            {(selectedElement.type === 'text' ||
              selectedElement.type === 'heading' ||
              selectedElement.type === 'button') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">字體大小</label>
                <input
                  type="number"
                  value={selectedElement.styles.fontSize || 16}
                  onChange={(e) =>
                    updateElementStyles(selectedElement.id, { fontSize: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min={8}
                  max={200}
                />
              </div>
            )}

            {/* 圓角 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">圓角</label>
              <input
                type="number"
                value={selectedElement.styles.borderRadius || 0}
                onChange={(e) =>
                  updateElementStyles(selectedElement.id, { borderRadius: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min={0}
                max={100}
              />
            </div>

            {/* 內距 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">內距</label>
              <input
                type="number"
                value={selectedElement.styles.padding || 0}
                onChange={(e) =>
                  updateElementStyles(selectedElement.id, { padding: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* 層級控制 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">層級</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => bringToFront(selectedElement.id)}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                移到最前
              </button>
              <button
                onClick={() => sendToBack(selectedElement.id)}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                移到最後
              </button>
            </div>
          </div>

          {/* 刪除按鈕 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => deleteElement(selectedElement.id)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🗑️ 刪除元素
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 如果選中了 Section，顯示 Section 屬性
  if (selectedSection) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">區塊屬性</h3>

          {/* Section 名稱 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">區塊名稱</label>
            <input
              type="text"
              value={selectedSection.name}
              onChange={(e) => updateSection(selectedSection.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 背景設定 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 mt-6 mb-3">背景</h4>

            {/* 背景類型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景類型</label>
              <select
                value={selectedSection.background.type}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    background: {
                      ...selectedSection.background,
                      type: e.target.value as any,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="color">純色</option>
                <option value="gradient">漸層</option>
                <option value="image">圖片</option>
              </select>
            </div>

            {/* 背景顏色 */}
            {selectedSection.background.type === 'color' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">背景顏色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedSection.background.color || '#ffffff'}
                    onChange={(e) =>
                      updateSection(selectedSection.id, {
                        background: {
                          ...selectedSection.background,
                          color: e.target.value,
                        },
                      })
                    }
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedSection.background.color || '#ffffff'}
                    onChange={(e) =>
                      updateSection(selectedSection.id, {
                        background: {
                          ...selectedSection.background,
                          color: e.target.value,
                        },
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 背景圖片 */}
            {selectedSection.background.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">圖片 URL</label>
                <input
                  type="text"
                  value={selectedSection.background.imageUrl || ''}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      background: {
                        ...selectedSection.background,
                        imageUrl: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>

          {/* 佈局設定 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 mt-6 mb-3">佈局</h4>

            {/* 容器寬度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">容器寬度</label>
              <select
                value={selectedSection.container.width}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    container: {
                      ...selectedSection.container,
                      width: e.target.value as 'full' | 'boxed',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="boxed">居中（Boxed）</option>
                <option value="full">全寬（Full Width）</option>
              </select>
            </div>

            {/* 最大寬度 (只在 boxed 模式顯示) */}
            {selectedSection.container.width === 'boxed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最大寬度 (px)</label>
                <input
                  type="number"
                  value={selectedSection.container.maxWidth || 1200}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      container: {
                        ...selectedSection.container,
                        maxWidth: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min={600}
                  max={2000}
                />
              </div>
            )}

            {/* 最小高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最小高度 (px)</label>
              <input
                type="number"
                value={selectedSection.minHeight || 400}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    minHeight: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min={200}
                max={2000}
              />
            </div>

            {/* 內距 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">上邊距</label>
                <input
                  type="number"
                  value={selectedSection.padding.top}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      padding: {
                        ...selectedSection.padding,
                        top: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">下邊距</label>
                <input
                  type="number"
                  value={selectedSection.padding.bottom}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      padding: {
                        ...selectedSection.padding,
                        bottom: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">左邊距</label>
                <input
                  type="number"
                  value={selectedSection.padding.left}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      padding: {
                        ...selectedSection.padding,
                        left: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">右邊距</label>
                <input
                  type="number"
                  value={selectedSection.padding.right}
                  onChange={(e) =>
                    updateSection(selectedSection.id, {
                      padding: {
                        ...selectedSection.padding,
                        right: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 沒有選中任何東西
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <div className="text-center text-gray-400 mt-20">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <p className="text-sm">選擇元素或區塊以編輯屬性</p>
      </div>
    </div>
  )
}
