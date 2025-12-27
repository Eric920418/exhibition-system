import React from 'react'
import { useNode } from '@craftjs/core'
import { TextProps } from '../Text'

export const TextSettings = () => {
  const {
    actions: { setProp },
    fontSize,
    fontWeight,
    color,
    textAlign,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    textAlign: node.data.props.textAlign,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          字體大小 (px)
        </label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => {
            setProp((props: TextProps) => {
              props.fontSize = parseInt(e.target.value)
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          字體粗細
        </label>
        <select
          value={fontWeight}
          onChange={(e) => {
            setProp((props: TextProps) => {
              props.fontWeight = parseInt(e.target.value)
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="300">細</option>
          <option value="400">正常</option>
          <option value="500">中等</option>
          <option value="600">粗</option>
          <option value="700">特粗</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          文字顏色
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setProp((props: TextProps) => {
              props.color = e.target.value
            })
          }}
          className="w-full h-10 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          對齊方式
        </label>
        <select
          value={textAlign}
          onChange={(e) => {
            setProp((props: TextProps) => {
              props.textAlign = e.target.value as 'left' | 'center' | 'right'
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">靠左</option>
          <option value="center">置中</option>
          <option value="right">靠右</option>
        </select>
      </div>
    </div>
  )
}
