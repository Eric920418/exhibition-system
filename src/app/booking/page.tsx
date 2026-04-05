'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  venueType: 'INDOOR' | 'OUTDOOR' | null
  exhibition: {
    id: string
    name: string
    year: number
    slug: string
    venueType: 'INDOOR' | 'OUTDOOR' | null
  }
  config: {
    slotDurationMinutes: number
    maxConcurrentCapacity: number
    dailyStartTime: string
    dailyEndTime: string
  }
  queueStats: {
    waiting: number
    estimatedWaitMinutes: number
  }
}

type VenueFilter = 'ALL' | 'INDOOR' | 'OUTDOOR'

export default function BookingPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<VenueFilter>('ALL')

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await apiClient.get<{ teams: Team[]; date: string }>(
          '/reservations/available-teams'
        )
        setTeams(data.teams)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
    const interval = setInterval(fetchTeams, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredTeams = teams.filter((team) => {
    if (filter === 'ALL') return true
    return team.venueType === filter
  })

  // 按展覽分組
  const grouped = filteredTeams.reduce(
    (acc, team) => {
      const key = team.exhibition.id
      if (!acc[key]) {
        acc[key] = {
          exhibition: team.exhibition,
          teams: [],
        }
      }
      acc[key].teams.push(team)
      return acc
    },
    {} as Record<string, { exhibition: Team['exhibition']; teams: Team[] }>
  )

  const hasIndoor = teams.some((t) => t.venueType === 'INDOOR')
  const hasOutdoor = teams.some((t) => t.venueType === 'OUTDOOR')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">展覽預約</h1>
          <p className="text-gray-600 mt-1">選擇展覽類型，預約您想參觀的組別</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 校內展 / 校外展 切換 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {hasIndoor && (
            <button
              onClick={() => setFilter('INDOOR')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'INDOOR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              校內展
            </button>
          )}
          {hasOutdoor && (
            <button
              onClick={() => setFilter('OUTDOOR')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'OUTDOOR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              校外展
            </button>
          )}
        </div>

        {/* 組別列表 */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {filter === 'ALL'
                ? '目前沒有開放預約的組別'
                : filter === 'INDOOR'
                ? '目前沒有校內展的預約'
                : '目前沒有校外展的預約'}
            </h2>
            <p className="text-gray-600">請稍後再試或聯繫工作人員</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(grouped).map(({ exhibition, teams: groupTeams }) => (
              <div key={exhibition.id}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {exhibition.name}{' '}
                    <span className="text-gray-400">({exhibition.year})</span>
                  </h2>
                  {exhibition.venueType && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        exhibition.venueType === 'INDOOR'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {exhibition.venueType === 'INDOOR' ? '校內展' : '校外展'}
                    </span>
                  )}
                </div>

                <div className="grid gap-4">
                  {groupTeams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/reservations/${team.id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2 sm:line-clamp-1">
                              {team.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                            <span>
                              {team.config.dailyStartTime} - {team.config.dailyEndTime}
                            </span>
                            <span>
                              每時段 {team.config.slotDurationMinutes} 分鐘
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:flex-col sm:text-right gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div className="flex items-center sm:block gap-2">
                            <div className="text-2xl font-bold text-blue-600">
                              {team.queueStats.waiting}
                            </div>
                            <div className="text-sm text-gray-500">人等候中</div>
                          </div>
                          <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium group-hover:bg-blue-700 transition-colors whitespace-nowrap">
                            立即取號
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 查詢預約連結 */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">已經有預約了？</p>
          <Link
            href="/reservations/status"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            查詢我的預約
          </Link>
        </div>
      </main>
    </div>
  )
}
