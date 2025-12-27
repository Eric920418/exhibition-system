'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/kanban/CalendarView'
import { CardDetailModal } from '@/components/kanban/CardDetailModal'
import type { Board, Card } from '@/components/kanban/KanbanBoard'

interface CalendarClientProps {
  board: Board
}

export function CalendarClient({ board: initialBoard }: CalendarClientProps) {
  const [board, setBoard] = useState(initialBoard)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handleCardUpdate = (updatedCard: Card) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      })),
    }))
    setSelectedCard(updatedCard)
  }

  const handleCardDelete = (cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) => ({
        ...list,
        cards: list.cards.filter((card) => card.id !== cardId),
      })),
    }))
    setSelectedCard(null)
  }

  return (
    <>
      <CalendarView board={board} onCardClick={handleCardClick} />

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </>
  )
}
