import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQueueStats, formatDateString } from '@/lib/reservation-utils'
import { createSSESubscriber, ReservationEvent } from '@/lib/reservation-events'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

/**
 * GET /api/reservations/stream/display/[teamId]
 * 單組別大螢幕 SSE 串流（公開）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { teamId } = await context.params

  // 檢查組別是否存在
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  })

  if (!team) {
    return new Response('Team not found', { status: 404 })
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

        const [currentServing, stats] = await Promise.all([
          prisma.currentServing.findUnique({
            where: { teamId },
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
          getQueueStats(teamId, today),
        ])

        sendMessage({
          type: 'INIT',
          data: {
            teamId,
            teamName: team.name,
            currentSequenceNumber: currentServing?.currentSequenceNumber || 0,
            visitorName: currentServing?.reservation?.visitorName
              ? maskName(currentServing.reservation.visitorName)
              : null,
            queueWaiting: stats.waiting,
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

      // 訂閱 Redis Pub/Sub
      try {
        unsubscribe = await createSSESubscriber(teamId, (event: ReservationEvent) => {
          sendMessage({
            type: event.type,
            data: event.data,
          })
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
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}
