'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { MultiTeamDisplay } from '@/components/reservations/MultiTeamDisplay'

function MultiTeamDisplayContent() {
  const searchParams = useSearchParams()
  const teamIdsParam = searchParams.get('teamIds')

  const teamIds = teamIdsParam ? teamIdsParam.split(',').filter(Boolean) : undefined

  return <MultiTeamDisplay teamIds={teamIds} />
}

export default function MultiTeamDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-slate-400">載入中...</div>
        </div>
      }
    >
      <MultiTeamDisplayContent />
    </Suspense>
  )
}
