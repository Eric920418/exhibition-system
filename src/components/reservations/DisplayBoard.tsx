'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface DisplayBoardProps {
  teamId: string
  teamName: string
  className?: string
}

interface DisplayData {
  teamId: string
  teamName: string
  currentSequenceNumber: number
  visitorName: string | null
  queueWaiting: number
}

export function DisplayBoard({ teamId, teamName, className }: DisplayBoardProps) {
  const [data, setData] = useState<DisplayData>({
    teamId,
    teamName,
    currentSequenceNumber: 0,
    visitorName: null,
    queueWaiting: 0,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      eventSource = new EventSource(`/api/reservations/stream/display/${teamId}`)

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)

          if (parsed.type === 'INIT') {
            setData({
              teamId: parsed.data.teamId,
              teamName: parsed.data.teamName,
              currentSequenceNumber: parsed.data.currentSequenceNumber,
              visitorName: parsed.data.visitorName,
              queueWaiting: parsed.data.queueWaiting,
            })
          } else if (parsed.type === 'SERVING_UPDATE') {
            // 閃爍效果
            setIsFlashing(true)
            setTimeout(() => setIsFlashing(false), 1000)

            setData((prev) => ({
              ...prev,
              currentSequenceNumber: parsed.data.currentSequenceNumber ?? prev.currentSequenceNumber,
              visitorName: parsed.data.visitorName ?? null,
              queueWaiting: parsed.data.queueWaiting ?? prev.queueWaiting,
            }))
          } else if (parsed.type === 'QUEUE_UPDATE') {
            setData((prev) => ({
              ...prev,
              queueWaiting: parsed.data.queueWaiting ?? prev.queueWaiting,
            }))
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
  }, [teamId])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8',
        className
      )}
    >
      {/* Connection status */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
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

      {/* Team name */}
      <h1 className="text-3xl md:text-4xl font-bold text-slate-300 mb-8">
        {data.teamName}
      </h1>

      {/* Current number */}
      <div
        className={cn(
          'relative transition-all duration-300',
          isFlashing && 'scale-110'
        )}
      >
        <div className="text-2xl md:text-3xl text-slate-400 mb-4 text-center">
          目前號碼
        </div>
        <div
          className={cn(
            'text-[12rem] md:text-[16rem] font-bold leading-none tabular-nums transition-colors duration-300',
            isFlashing ? 'text-yellow-400' : 'text-white'
          )}
        >
          {data.currentSequenceNumber || '-'}
        </div>
        {data.visitorName && (
          <div className="text-4xl md:text-5xl text-slate-300 mt-4 text-center">
            {data.visitorName}
          </div>
        )}
      </div>

      {/* Queue info */}
      <div className="mt-12 flex items-center gap-8">
        <div className="text-center">
          <div className="text-xl text-slate-400">等候人數</div>
          <div className="text-5xl font-bold text-blue-400 tabular-nums">
            {data.queueWaiting}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-slate-500 text-sm">
        {new Date().toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </div>
    </div>
  )
}
