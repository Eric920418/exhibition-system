export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BoardSettingsClient } from './BoardSettingsClient'

interface PageProps {
  params: Promise<{ boardId: string }>
}

export default async function BoardSettingsPage({ params }: PageProps) {
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
        },
      },
      _count: {
        select: {
          lists: true,
        },
      },
    },
  })

  if (!board) {
    notFound()
  }

  // 計算總卡片數
  const cardCount = await prisma.card.count({
    where: {
      list: {
        boardId: boardId,
      },
    },
  })

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <Link
          href={`/admin/boards/${boardId}`}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回看板
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">看板設定</h1>
        <p className="text-gray-600 mt-2">{board.name}</p>
      </div>

      <BoardSettingsClient
        board={{
          id: board.id,
          name: board.name,
          description: board.description,
          exhibitionId: board.exhibitionId,
          exhibitionName: board.exhibition.name,
          exhibitionYear: board.exhibition.year,
          listsCount: board._count.lists,
          cardsCount: cardCount,
          createdAt: board.createdAt.toISOString(),
        }}
      />
    </div>
  )
}
