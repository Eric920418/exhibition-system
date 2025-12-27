'use client'

import React from 'react'
import { useEditor } from '@craftjs/core'

export const SettingsPanel = () => {
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last()
    let selected

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      }
    }

    return {
      selected,
    }
  })

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selected.name}
              </h3>
              {selected.isDeletable && (
                <button
                  onClick={() => {
                    actions.delete(selected.id)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              {selected.settings && React.createElement(selected.settings)}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
            <p className="text-sm">點擊元件以編輯屬性</p>
          </div>
        )}
      </div>
    </div>
  )
}
