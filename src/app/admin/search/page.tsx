import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: string
  url: string
  name?: string
  title?: string
  email?: string
  exhibitionName?: string
  teamName?: string
  year?: number
  status?: string
  role?: string
  tier?: string
  address?: string
  documentType?: string
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

const TYPE_COLORS: Record<string, string> = {
  exhibitions: 'bg-blue-100 text-blue-800',
  artworks: 'bg-purple-100 text-purple-800',
  teams: 'bg-green-100 text-green-800',
  users: 'bg-yellow-100 text-yellow-800',
  sponsors: 'bg-pink-100 text-pink-800',
  venues: 'bg-orange-100 text-orange-800',
  documents: 'bg-gray-100 text-gray-800',
}

async function SearchResults({
  query,
  type,
}: {
  query: string
  type?: string
}) {
  if (!query || query.length < 2) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>請輸入至少 2 個字元進行搜尋</p>
      </div>
    )
  }

  const url = new URL('/api/search', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '20')
  if (type) {
    url.searchParams.set('types', type)
  }

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  })
  const data = await response.json()

  if (!data.success) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>搜尋時發生錯誤：{data.error}</p>
      </div>
    )
  }

  const results: SearchResults = data.data.results
  const totalResults = data.data.totalResults

  if (totalResults === 0) {
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">找不到符合「{query}」的結果</p>
        <p className="mt-2 text-sm">請嘗試使用不同的關鍵字或篩選條件</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-gray-600">
        找到 <span className="font-semibold">{totalResults}</span> 個結果
      </p>

      {Object.entries(results).map(([category, items]) =>
        items.length > 0 ? (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs rounded-full ${TYPE_COLORS[category]}`}
              >
                {TYPE_LABELS[category]}
              </span>
              <span className="text-sm font-normal text-gray-500">
                ({items.length} 筆)
              </span>
            </h3>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item: SearchResult) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 truncate">
                    {item.name || item.title || item.email}
                  </div>
                  {(item.exhibitionName || item.teamName) && (
                    <div className="text-sm text-gray-500 mt-1 truncate">
                      {item.exhibitionName || item.teamName}
                    </div>
                  )}
                  {item.address && (
                    <div className="text-sm text-gray-500 mt-1 truncate">
                      {item.address}
                    </div>
                  )}
                  {item.status && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {item.status}
                    </span>
                  )}
                  {item.tier && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {item.tier}
                    </span>
                  )}
                  {item.role && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                      {item.role}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const { q: query = '', type } = await searchParams

  const types = [
    { value: '', label: '全部' },
    { value: 'exhibitions', label: '展覽' },
    { value: 'artworks', label: '作品' },
    { value: 'teams', label: '團隊' },
    { value: 'users', label: '用戶' },
    { value: 'sponsors', label: '贊助商' },
    { value: 'venues', label: '場地' },
    { value: 'documents', label: '文件' },
  ]

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">搜尋</h1>

        {/* 搜尋表單 */}
        <form method="get" className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="搜尋展覽、作品、團隊..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              name="type"
              defaultValue={type || ''}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜尋
            </button>
          </div>
        </form>

        {/* 搜尋結果 */}
        <Suspense
          fallback={
            <div className="text-center py-12">
              <svg
                className="animate-spin mx-auto h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-4 text-gray-500">搜尋中...</p>
            </div>
          }
        >
          <SearchResults query={query} type={type} />
        </Suspense>
      </div>
    </div>
  )
}
