'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  /** API 端點，例如 '/api/exhibitions/export' */
  endpoint: string
  /** 額外的查詢參數 */
  params?: Record<string, string | undefined>
  /** 按鈕文字 */
  label?: string
  /** 禁用狀態 */
  disabled?: boolean
  /** 按鈕尺寸 */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** 變體 */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

type ExportFormat = 'csv' | 'json' | 'xlsx'

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV 格式',
  json: 'JSON 格式',
  xlsx: 'Excel 格式',
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  csv: (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  json: (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  xlsx: (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
}

export function ExportButton({
  endpoint,
  params = {},
  label = '匯出',
  disabled = false,
  size = 'default',
  variant = 'outline',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    setError(null)

    try {
      // 構建 URL 和查詢參數
      const url = new URL(endpoint, window.location.origin)
      url.searchParams.set('format', format)

      // 添加額外參數
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value)
        }
      })

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '匯出失敗')
      }

      // 從 Content-Disposition 獲取檔名
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || `export.${format === 'xlsx' ? 'xls' : format}`

      // 下載檔案
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '匯出失敗')
      console.error('Export error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={disabled || loading}>
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                匯出中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {label}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              className="cursor-pointer"
            >
              {FORMAT_ICONS[format]}
              {FORMAT_LABELS[format]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <div className="absolute top-full mt-1 right-0 bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}
