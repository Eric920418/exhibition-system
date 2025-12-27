'use client'

import React from 'react'
import { useEditor, Element } from '@craftjs/core'
import { Container } from './components/Container'
import { Text } from './components/Text'
import { Button } from './components/Button'
import { Image } from './components/Image'

export const Toolbox = () => {
  const { connectors } = useEditor()

  const components = [
    {
      name: '容器',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      ),
      component: (
        <Element is={Container} canvas padding={20} background="#f3f4f6">
          <Text text="將元件拖拽到此處" fontSize={14} color="#6b7280" />
        </Element>
      ),
    },
    {
      name: '文字',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
      component: <Text text="文字" fontSize={16} />,
    },
    {
      name: '圖片',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      component: <Image src="https://via.placeholder.com/400x300" alt="圖片" />,
    },
    {
      name: '按鈕',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
      component: <Button text="按鈕" />,
    },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">元件</h3>

        {/* 使用提示 */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 拖拽元件到右側畫布來建立頁面
          </p>
        </div>

        <div className="space-y-2">
          {components.map((comp, index) => (
            <button
              key={index}
              ref={(ref) => {
                if (ref) {
                  connectors.create(ref, comp.component)
                }
              }}
              className="craftjs-toolbox-button w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition-all duration-200 cursor-move shadow-sm hover:shadow-md"
              title={`拖拽 ${comp.name} 到畫布`}
            >
              <div className="text-blue-600">
                {comp.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {comp.name}
              </span>
              <svg className="ml-auto w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          ))}
        </div>

        {/* 快捷提示 */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">快捷鍵</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 點擊元件查看設定</li>
            <li>• Delete 刪除選中元件</li>
            <li>• 拖動元件重新排序</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
