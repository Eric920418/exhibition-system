'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Monitor, RefreshCw, Calendar } from 'lucide-react'
import { CurrentServingCard } from '@/components/reservations/CurrentServingCard'
import { QueueControlPanel } from '@/components/reservations/QueueControlPanel'
import { WaitingList } from '@/components/reservations/WaitingList'

interface Team {
  id: string
  name: string
  exhibition: {
    id: string
    name: string
  }
}

interface ServingStatus {
  currentSequenceNumber: number
  servingReservation: {
    id: string
    sequenceNumber: number
    visitorName: string
    visitorPhone: string
    calledAt: string | null
  } | null
  stats: {
    waiting: number
    called: number
    completed: number
    noShow: number
    avgWaitMinutes: number
  }
}

interface Reservation {
  id: string
  sequenceNumber: number
  visitorName: string
  visitorPhone: string
  status: string
  estimatedWaitMinutes: number | null
  checkInTime: string | null
  calledAt: string | null
  completedAt: string | null
  notes: string | null
  createdAt: string
}

interface QueueData {
  date: string
  reservations: Reservation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function QueuePage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [servingStatus, setServingStatus] = useState<ServingStatus | null>(null)
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Fetch team info
  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`)
      if (!res.ok) throw new Error('無法獲取組別資訊')
      const data = await res.json()
      setTeam(data.data)
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '載入失敗',
        variant: 'destructive',
      })
    }
  }, [teamId, toast])

  // Fetch serving status
  const fetchServingStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}`)
      if (!res.ok) throw new Error('無法獲取服務狀態')
      const data = await res.json()
      setServingStatus(data.data)
    } catch (error) {
      console.error('Fetch serving status error:', error)
    }
  }, [teamId])

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        date: today,
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/reservations/queue/${teamId}?${params}`)
      if (!res.ok) throw new Error('無法獲取隊列資料')
      const data = await res.json()
      setQueueData(data.data)
    } catch (error) {
      console.error('Fetch queue error:', error)
    }
  }, [teamId, today, page, statusFilter])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTeam(), fetchServingStatus(), fetchQueueData()])
      setLoading(false)
    }
    loadData()
  }, [fetchTeam, fetchServingStatus, fetchQueueData])

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServingStatus()
      fetchQueueData()
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [fetchServingStatus, fetchQueueData])

  // Action handlers
  const handleCallNext = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}/next`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '叫號失敗')
      }

      if (data.data?.hasNext) {
        toast({
          title: '已叫號',
          description: `${data.data.reservation.sequenceNumber} 號 - ${data.data.reservation.visitorName}`,
        })
      } else {
        toast({
          title: '提示',
          description: data.message || '目前沒有等候中的預約',
        })
      }

      await Promise.all([fetchServingStatus(), fetchQueueData()])
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '叫號失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCallSpecific = async (reservationId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '叫號失敗')
      }

      toast({
        title: '已叫號',
        description: data.message,
      })

      await Promise.all([fetchServingStatus(), fetchQueueData()])
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '叫號失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (reservationId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '操作失敗')
      }

      toast({
        title: '已完成',
        description: data.message,
      })

      await Promise.all([fetchServingStatus(), fetchQueueData()])
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '操作失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoShow = async (reservationId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '操作失敗')
      }

      toast({
        title: '已標記未到',
        description: data.message,
      })

      await Promise.all([fetchServingStatus(), fetchQueueData()])
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '操作失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequeue = async (reservationId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/serving/${teamId}/requeue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '操作失敗')
      }

      toast({
        title: '已重新排隊',
        description: data.message,
      })

      await Promise.all([fetchServingStatus(), fetchQueueData()])
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '操作失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([fetchServingStatus(), fetchQueueData()])
    setLoading(false)
    toast({
      title: '已重新整理',
      description: '資料已更新',
    })
  }

  if (loading && !team) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">叫號管理</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{team?.exhibition.name}</span>
              <span>/</span>
              <span>{team?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            {today}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重新整理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/reservations/display/${teamId}`, '_blank')}
          >
            <Monitor className="h-4 w-4 mr-1" />
            開啟大螢幕
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Current Serving & Controls */}
        <div className="space-y-6">
          <CurrentServingCard
            currentNumber={servingStatus?.currentSequenceNumber || 0}
            reservation={servingStatus?.servingReservation}
            onComplete={handleComplete}
            onNoShow={handleNoShow}
            onRequeue={handleRequeue}
            loading={actionLoading}
          />

          <QueueControlPanel
            stats={servingStatus?.stats || {
              waiting: 0,
              called: 0,
              completed: 0,
              noShow: 0,
              avgWaitMinutes: 0,
            }}
            onCallNext={handleCallNext}
            loading={actionLoading}
          />
        </div>

        {/* Right Column - Waiting List */}
        <div className="lg:col-span-2">
          <WaitingList
            reservations={queueData?.reservations || []}
            pagination={queueData?.pagination || {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => {
              setStatusFilter(status)
              setPage(1)
            }}
            onPageChange={setPage}
            onCallSpecific={handleCallSpecific}
            loading={actionLoading}
          />
        </div>
      </div>
    </div>
  )
}
