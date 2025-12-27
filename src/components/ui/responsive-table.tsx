'use client'

import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  /** 是否在移動端隱藏此列 */
  hideOnMobile?: boolean
  /** 自訂渲染函數 */
  render?: (row: T) => ReactNode
  /** 在移動端卡片模式下的顯示優先級（1-3，1 最高） */
  mobilePriority?: 1 | 2 | 3
  /** 列寬度 */
  width?: string
  /** 文字對齊 */
  align?: 'left' | 'center' | 'right'
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** 唯一標識字段 */
  keyField: keyof T
  /** 無數據時顯示的文字 */
  emptyText?: string
  /** 行點擊事件 */
  onRowClick?: (row: T) => void
  /** 是否顯示斑馬條紋 */
  striped?: boolean
  /** 是否顯示邊框 */
  bordered?: boolean
  /** 自訂卡片渲染（移動端） */
  renderMobileCard?: (row: T, columns: Column<T>[]) => ReactNode
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyText = '暫無數據',
  onRowClick,
  striped = true,
  bordered = true,
  renderMobileCard,
}: ResponsiveTableProps<T>) {
  // 取得值的通用函數
  const getValue = (row: T, key: string): unknown => {
    const keys = key.split('.')
    let value: unknown = row
    for (const k of keys) {
      if (value === null || value === undefined) return null
      value = (value as Record<string, unknown>)[k]
    }
    return value
  }

  // 預設移動端卡片渲染
  const defaultMobileCard = (row: T) => {
    const priorityColumns = columns
      .filter((col) => !col.hideOnMobile)
      .sort((a, b) => (a.mobilePriority || 3) - (b.mobilePriority || 3))

    return (
      <div className="p-4 space-y-2">
        {priorityColumns.map((col) => (
          <div key={col.key} className="flex justify-between items-start">
            <span className="text-sm text-gray-500 font-medium">{col.header}</span>
            <span className="text-sm text-gray-900 text-right max-w-[60%]">
              {col.render
                ? col.render(row)
                : String(getValue(row, col.key) ?? '-')}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <>
      {/* 桌面版表格 */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns
                .filter((col) => !col.hideOnMobile || true) // 桌面版顯示所有列
                .map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-${col.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200`}>
            {data.map((row, index) => (
              <tr
                key={String(row[keyField])}
                className={`
                  ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-100' : ''}
                  transition-colors
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${col.align || 'left'}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(getValue(row, col.key) ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移動端卡片列表 */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div
            key={String(row[keyField])}
            className={`
              bg-white rounded-lg shadow-sm border border-gray-200
              ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}
            `}
            onClick={() => onRowClick?.(row)}
          >
            {renderMobileCard
              ? renderMobileCard(row, columns)
              : defaultMobileCard(row)}
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * 分頁元件
 */
interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  baseUrl: string
  searchParams?: Record<string, string>
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(page) })
    return `${baseUrl}?${params.toString()}`
  }

  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  // 計算要顯示的頁碼
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // 最多顯示 5 個頁碼

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('ellipsis', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1, 'ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('ellipsis', totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-0">
      {/* 顯示信息 */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        顯示 {startItem} - {endItem} 筆，共 {total} 筆
      </p>

      {/* 分頁按鈕 */}
      <nav className="flex items-center gap-1 order-1 sm:order-2">
        {/* 上一頁 */}
        <a
          href={currentPage > 1 ? buildUrl(currentPage - 1) : '#'}
          className={`px-3 py-2 text-sm rounded-md ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-disabled={currentPage === 1}
        >
          <span className="hidden sm:inline">上一頁</span>
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>

        {/* 頁碼 */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                ...
              </span>
            ) : (
              <a
                key={page}
                href={buildUrl(page)}
                className={`px-3 py-2 text-sm rounded-md ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </a>
            )
          )}
        </div>

        {/* 移動端頁碼顯示 */}
        <span className="sm:hidden px-3 py-2 text-sm text-gray-600">
          {currentPage} / {totalPages}
        </span>

        {/* 下一頁 */}
        <a
          href={currentPage < totalPages ? buildUrl(currentPage + 1) : '#'}
          className={`px-3 py-2 text-sm rounded-md ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-disabled={currentPage === totalPages}
        >
          <span className="hidden sm:inline">下一頁</span>
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </nav>
    </div>
  )
}
