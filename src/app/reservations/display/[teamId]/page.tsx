'use client'

import { use, useEffect, useState } from 'react'
import { DisplayBoard } from '@/components/reservations/DisplayBoard'

export default function SingleTeamDisplayPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}`)
        if (!res.ok) {
          throw new Error('找不到指定的組別')
        }
        const data = await res.json()
        setTeamName(data.data?.name || '組別')
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗')
      }
    }
    fetchTeam()
  }, [teamId])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">錯誤</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return <DisplayBoard teamId={teamId} teamName={teamName} />
}
