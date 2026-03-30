export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, Calendar, LayoutGrid } from 'lucide-react'
import { CalendarClient } from './CalendarClient'

interface PageProps {
  params: Promise<{ boardId: string }>
}

export default async function BoardCalendarPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { boardId } = await params

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
        },
      },
      lists: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              assignments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              subtasks: {
                orderBy: { position: 'asc' },
              },
              _count: {
                select: {
                  comments: true,
                  subtasks: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!board) {
    notFound()
  }

  // 計算有到期日的卡片數量
  const cardsWithDueDate = board.lists.reduce(
    (sum, list) => sum + list.cards.filter((card) => card.dueDate).length,
    0
  )

  const totalCards = board.lists.reduce(
    (sum, list) => sum + list.cards.length,
    0
  )

  return (
    <div className="h-full flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/boards"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-800">{board.name}</h1>
                <Badge variant="secondary">{board.exhibition.year}</Badge>
              </div>
              <p className="text-sm text-gray-500">
                {board.exhibition.name} · 日曆視圖
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 統計信息 */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  <strong>{cardsWithDueDate}</strong> / {totalCards} 有到期日
                </span>
              </div>
            </div>

            {/* 視圖切換按鈕 */}
            <div className="flex rounded-lg border overflow-hidden">
              <Link
                href={`/admin/boards/${boardId}`}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 border-r"
              >
                <LayoutGrid className="w-4 h-4" />
              </Link>
              <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600">
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <Link href={`/admin/boards/${boardId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 日曆內容 */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <CalendarClient board={board} />
      </div>
    </div>
  )
}
