import React from 'react'
import { useNode } from '@craftjs/core'
import { ButtonProps } from '../Button'

export const ButtonSettings = () => {
  const {
    actions: { setProp },
    text,
    backgroundColor,
    color,
    padding,
    borderRadius,
    href,
  } = useNode((node) => ({
    text: node.data.props.text,
    backgroundColor: node.data.props.backgroundColor,
    color: node.data.props.color,
    padding: node.data.props.padding,
    borderRadius: node.data.props.borderRadius,
    href: node.data.props.href,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          按鈕文字
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.text = e.target.value
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          背景顏色
        </label>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.backgroundColor = e.target.value
            })
          }}
          className="w-full h-10 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          文字顏色
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.color = e.target.value
            })
          }}
          className="w-full h-10 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          內距 (例：10px 20px)
        </label>
        <input
          type="text"
          value={padding}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.padding = e.target.value
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          圓角 (px)
        </label>
        <input
          type="number"
          value={borderRadius}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.borderRadius = parseInt(e.target.value)
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          連結網址
        </label>
        <input
          type="text"
          value={href}
          onChange={(e) => {
            setProp((props: ButtonProps) => {
              props.href = e.target.value
            })
          }}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
