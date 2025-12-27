import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'
import { createSSESubscriber, ReservationEvent } from '@/lib/reservation-events'

/**
 * GET /api/reservations/stream/display-multi
 * 多組別大螢幕 SSE 串流（公開）
 *
 * Query params:
 * - teamIds: 逗號分隔的組別 ID 列表（可選，不傳則獲取所有啟用預約的組別）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const teamIdsParam = searchParams.get('teamIds')

  let teamIds: string[] = []

  if (teamIdsParam) {
    teamIds = teamIdsParam.split(',').filter(Boolean)
  } else {
    // 獲取所有啟用預約的組別
    const configs = await prisma.reservationConfig.findMany({
      where: { isActive: true },
      select: { teamId: true },
    })
    teamIds = configs.map((c) => c.teamId)
  }

  if (teamIds.length === 0) {
    return new Response('No teams found', { status: 404 })
  }

  // 獲取組別資訊
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, name: true },
  })

  if (teams.length === 0) {
    return new Response('No teams found', { status: 404 })
  }

  let unsubscribe: (() => void) | null = null
  let heartbeatInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // 發送訊息輔助函數
      const sendMessage = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          // Stream 可能已關閉
        }
      }

      // 發送初始狀態
      try {
        const today = new Date(formatDateString(new Date()) + 'T00:00:00.000Z')

        const teamsData = await Promise.all(
          teams.map(async (team) => {
            const [currentServing, stats] = await Promise.all([
              prisma.currentServing.findUnique({
                where: { teamId: team.id },
                include: {
                  reservation: {
                    select: {
                      id: true,
                      sequenceNumber: true,
                      visitorName: true,
                    },
                  },
                },
              }),
              getQueueStats(team.id, today),
            ])

            return {
              teamId: team.id,
              teamName: team.name,
              currentSequenceNumber: currentServing?.currentSequenceNumber || 0,
              visitorName: currentServing?.reservation?.visitorName
                ? maskName(currentServing.reservation.visitorName)
                : null,
              queueWaiting: stats.waiting,
            }
          })
        )

        sendMessage({
          type: 'INIT',
          data: {
            teams: teamsData,
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        console.error('Failed to send initial state:', error)
      }

      // 設置心跳（每 30 秒）
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (e) {
          // Stream 可能已關閉
        }
      }, 30000)

      // 訂閱全域頻道
      try {
        unsubscribe = await createSSESubscriber(null, (event: ReservationEvent) => {
          // 只轉發在 teamIds 中的事件
          if (teamIds.includes(event.teamId)) {
            const team = teams.find((t) => t.id === event.teamId)
            sendMessage({
              type: event.type,
              data: {
                ...event.data,
                teamId: event.teamId,
                teamName: team?.name,
              },
            })
          }
        })
      } catch (error) {
        console.error('Failed to subscribe:', error)
      }
    },
    cancel() {
      // 清理資源
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
      if (unsubscribe) {
        unsubscribe()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}
