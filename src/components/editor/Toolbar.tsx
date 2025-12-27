'use client'

import React from 'react'
import { useEditor } from '@craftjs/core'
import { useRouter } from 'next/navigation'

interface ToolbarProps {
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
  isPublished: boolean
  saving?: boolean
  publishing?: boolean
}

export const Toolbar = ({
  onSave,
  onPreview,
  onPublish,
  isPublished,
  saving = false,
  publishing = false
}: ToolbarProps) => {
  const { actions, canUndo, canRedo } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))

  const router = useRouter()

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          返回
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={() => actions.history.undo()}
          disabled={!canUndo}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="復原"
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
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        <button
          onClick={() => actions.history.redo()}
          disabled={!canRedo}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="重做"
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
              d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {isPublished && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            已發布
          </span>
        )}

        <button
          onClick={onPreview}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          預覽
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>

        <button
          onClick={onPublish}
          disabled={publishing}
          className={`px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 ${
            isPublished
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {publishing ? '處理中...' : isPublished ? '取消發布' : '發布網站'}
        </button>
      </div>
    </div>
  )
}
