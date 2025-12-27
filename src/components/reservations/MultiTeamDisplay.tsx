'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TeamData {
  teamId: string
  teamName: string
  currentSequenceNumber: number
  visitorName: string | null
  queueWaiting: number
  isFlashing?: boolean
}

interface MultiTeamDisplayProps {
  teamIds?: string[]
  className?: string
}

export function MultiTeamDisplay({ teamIds, className }: MultiTeamDisplayProps) {
  const [teams, setTeams] = useState<TeamData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      const params = teamIds?.length ? `?teamIds=${teamIds.join(',')}` : ''
      eventSource = new EventSource(`/api/reservations/stream/display-multi${params}`)

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)

          if (parsed.type === 'INIT') {
            setTeams(
              parsed.data.teams.map((t: TeamData) => ({
                ...t,
                isFlashing: false,
              }))
            )
          } else if (parsed.type === 'SERVING_UPDATE') {
            const { teamId } = parsed.data

            // 閃爍效果
            setTeams((prev) =>
              prev.map((t) =>
                t.teamId === teamId
                  ? {
                      ...t,
                      currentSequenceNumber: parsed.data.currentSequenceNumber ?? t.currentSequenceNumber,
                      visitorName: parsed.data.visitorName ?? null,
                      queueWaiting: parsed.data.queueWaiting ?? t.queueWaiting,
                      isFlashing: true,
                    }
                  : t
              )
            )

            // 移除閃爍效果
            setTimeout(() => {
              setTeams((prev) =>
                prev.map((t) =>
                  t.teamId === teamId ? { ...t, isFlashing: false } : t
                )
              )
            }, 1000)
          } else if (parsed.type === 'QUEUE_UPDATE') {
            const { teamId } = parsed.data
            setTeams((prev) =>
              prev.map((t) =>
                t.teamId === teamId
                  ? {
                      ...t,
                      queueWaiting: parsed.data.queueWaiting ?? t.queueWaiting,
                    }
                  : t
              )
            )
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource?.close()
        // 重新連接
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      eventSource?.close()
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [teamIds])

  // 根據組別數量計算 grid 布局
  const gridCols =
    teams.length <= 2
      ? 'grid-cols-1 md:grid-cols-2'
      : teams.length <= 4
        ? 'grid-cols-2'
        : teams.length <= 6
          ? 'grid-cols-2 md:grid-cols-3'
          : 'grid-cols-2 md:grid-cols-4'

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 md:p-8',
        className
      )}
    >
      {/* Connection status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )}
        />
        <span className="text-sm text-slate-400">
          {isConnected ? '即時連線中' : '重新連線中...'}
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-300">
          叫號顯示
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">載入中...</div>
        </div>
      ) : (
        <div className={cn('grid gap-4 md:gap-6', gridCols)}>
          {teams.map((team) => (
            <TeamCard key={team.teamId} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}

function TeamCard({ team }: { team: TeamData }) {
  return (
    <div
      className={cn(
        'bg-slate-800/50 rounded-xl p-6 border border-slate-700 transition-all duration-300',
        team.isFlashing && 'ring-2 ring-yellow-400 scale-[1.02]'
      )}
    >
      {/* Team name */}
      <h2 className="text-lg font-semibold text-slate-300 text-center mb-4 truncate">
        {team.teamName}
      </h2>

      {/* Current number */}
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-1">目前號碼</div>
        <div
          className={cn(
            'text-6xl md:text-7xl font-bold tabular-nums transition-colors duration-300',
            team.isFlashing ? 'text-yellow-400' : 'text-white'
          )}
        >
          {team.currentSequenceNumber || '-'}
        </div>
        {team.visitorName && (
          <div className="text-xl text-slate-300 mt-2">{team.visitorName}</div>
        )}
      </div>

      {/* Queue info */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-center">
        <div className="text-center">
          <div className="text-xs text-slate-400">等候人數</div>
          <div className="text-2xl font-bold text-blue-400 tabular-nums">
            {team.queueWaiting}
          </div>
        </div>
      </div>
    </div>
  )
}
