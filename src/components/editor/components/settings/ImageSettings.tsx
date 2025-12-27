import React from 'react'
import { useNode } from '@craftjs/core'
import { ImageProps } from '../Image'

export const ImageSettings = () => {
  const {
    actions: { setProp },
    src,
    alt,
    width,
    height,
    objectFit,
    borderRadius,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    width: node.data.props.width,
    height: node.data.props.height,
    objectFit: node.data.props.objectFit,
    borderRadius: node.data.props.borderRadius,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          圖片網址
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.src = e.target.value
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          替代文字
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.alt = e.target.value
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          寬度
        </label>
        <input
          type="text"
          value={width}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.width = e.target.value
            })
          }}
          placeholder="例：100% 或 400px"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          高度
        </label>
        <input
          type="text"
          value={height}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.height = e.target.value
            })
          }}
          placeholder="例：auto 或 300px"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          填充方式
        </label>
        <select
          value={objectFit}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.objectFit = e.target.value as 'cover' | 'contain' | 'fill' | 'none'
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="cover">覆蓋</option>
          <option value="contain">包含</option>
          <option value="fill">填滿</option>
          <option value="none">原始</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          圓角 (px)
        </label>
        <input
          type="number"
          value={borderRadius}
          onChange={(e) => {
            setProp((props: ImageProps) => {
              props.borderRadius = parseInt(e.target.value)
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
