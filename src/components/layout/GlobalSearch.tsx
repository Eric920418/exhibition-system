'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: string
  url: string
  [key: string]: unknown
}

interface SearchResults {
  exhibitions?: SearchResult[]
  artworks?: SearchResult[]
  teams?: SearchResult[]
  users?: SearchResult[]
  sponsors?: SearchResult[]
  venues?: SearchResult[]
  documents?: SearchResult[]
}

const TYPE_LABELS: Record<string, string> = {
  exhibitions: '展覽',
  artworks: '作品',
  teams: '團隊',
  users: '用戶',
  sponsors: '贊助商',
  venues: '場地',
  documents: '文件',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  exhibitions: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  artworks: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  teams: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  sponsors: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  venues: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  documents: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({})
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 搜尋函數
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({})
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await response.json()
      if (data.success) {
        setResults(data.data.results)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 防抖搜尋
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // 快捷鍵 (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 聚焦輸入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 獲取所有結果的扁平列表
  const flatResults = Object.entries(results).flatMap(([type, items]) =>
    (items as SearchResult[]).map((item: SearchResult) => ({ ...item, category: type }))
  )

  // 鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      router.push(flatResults[selectedIndex].url)
      setIsOpen(false)
      setQuery('')
    }
  }

  // 獲取顯示名稱
  const getDisplayName = (item: SearchResult): string => {
    return (
      (item.name as string) ||
      (item.title as string) ||
      (item.email as string) ||
      String(item.id)
    )
  }

  // 獲取次要信息
  const getSubtitle = (item: SearchResult): string | null => {
    if (item.exhibitionName) return item.exhibitionName as string
    if (item.teamName) return item.teamName as string
    if (item.role) return item.role as string
    if (item.address) return item.address as string
    return null
  }

  return (
    <>
      {/* 搜尋按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">搜尋</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-300">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* 搜尋對話框 */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 搜尋面板 */}
          <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
            <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl">
              {/* 搜尋輸入框 */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="搜尋展覽、作品、團隊..."
                  className="flex-1 text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                {loading && (
                  <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border border-gray-300">
                    ESC
                  </kbd>
                </button>
              </div>

              {/* 搜尋結果 */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query.length >= 2 && flatResults.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>找不到符合「{query}」的結果</p>
                  </div>
                )}

                {Object.entries(results).map(([type, items]) =>
                  (items as SearchResult[]).length > 0 ? (
                    <div key={type} className="p-2">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                        {TYPE_LABELS[type] || type}
                      </div>
                      {(items as SearchResult[]).map((item: SearchResult, index: number) => {
                        const globalIndex = flatResults.findIndex(
                          (r) => r.id === item.id && r.category === type
                        )
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.url)
                              setIsOpen(false)
                              setQuery('')
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-blue-50 text-blue-600'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <span className="flex-shrink-0 text-gray-400">
                              {TYPE_ICONS[type]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getDisplayName(item)}
                              </p>
                              {getSubtitle(item) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {getSubtitle(item)}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : null
                )}
              </div>

              {/* 底部提示 */}
              {flatResults.length > 0 && (
                <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">↓</kbd>
                    導航
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd>
                    選擇
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
