'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KanbanBoard, type Board } from '@/components/kanban'

interface BoardClientProps {
  board: Board
}

export function BoardClient({ board: initialBoard }: BoardClientProps) {
  const router = useRouter()
  const [board, setBoard] = useState(initialBoard)

  const handleBoardUpdate = () => {
    router.refresh()
  }

  return <KanbanBoard board={board} onBoardUpdate={handleBoardUpdate} />
}
