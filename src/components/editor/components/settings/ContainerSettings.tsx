import React from 'react'
import { useNode } from '@craftjs/core'
import { ContainerProps } from '../Container'

export const ContainerSettings = () => {
  const {
    actions: { setProp },
    background,
    padding,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          背景顏色
        </label>
        <input
          type="color"
          value={background}
          onChange={(e) => {
            setProp((props: ContainerProps) => {
              props.background = e.target.value
            })
          }}
          className="w-full h-10 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          內距 (px)
        </label>
        <input
          type="number"
          value={padding}
          onChange={(e) => {
            setProp((props: ContainerProps) => {
              props.padding = parseInt(e.target.value)
            })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
