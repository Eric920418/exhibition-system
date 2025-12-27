'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import {
  DailyReservationsChart,
  StatusDistributionChart,
  HourlyDistributionChart,
} from '@/components/reservations/ReservationStatsChart'

interface Team {
  id: string
  name: string
  exhibition: {
    id: string
    name: string
  }
}

interface StatsData {
  period: {
    startDate: string
    endDate: string
  }
  summary: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    waiting: number
    completionRate: number
    noShowRate: number
    cancelRate: number
    avgServiceTimeMinutes: number
  }
  statusDistribution: { status: string; count: number }[]
  dailyStats: { date: string; count: number }[]
  hourlyDistribution: { hour: number; count: number }[]
  peakHour: {
    hour: number
    count: number
    label: string
  }
}

export default function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // 默認查詢最近 7 天
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)

  const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setTeam(data.data)
      }
    } catch (error) {
      console.error('Fetch team error:', error)
    }
  }, [teamId])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        teamId,
        startDate,
        endDate,
      })
      const res = await fetch(`/api/reservations/stats?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '載入統計失敗')
      }
      const data = await res.json()
      setStats(data.data)
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '載入統計失敗',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [teamId, startDate, endDate, toast])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        teamId,
        startDate,
        endDate,
        format,
      })
      const res = await fetch(`/api/reservations/stats/export?${params}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '匯出失敗')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations_${startDate}_${endDate}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: '匯出成功',
        description: `已下載 ${format.toUpperCase()} 報表`,
      })
    } catch (error) {
      toast({
        title: '匯出失敗',
        description: error instanceof Error ? error.message : '匯出失敗',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
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
            <h1 className="text-2xl font-bold">統計報表</h1>
            <p className="text-muted-foreground">
              {team?.exhibition.name} / {team?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">結束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchStats} disabled={loading}>
              {loading ? '載入中...' : '查詢'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">總預約</span>
                </div>
                <div className="text-3xl font-bold">{stats.summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">已完成</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.summary.completed}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">未到場</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {stats.summary.noShow}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">完成率</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.summary.completionRate}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">平均服務</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.summary.avgServiceTimeMinutes}分
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">尖峰時段</span>
                </div>
                <div className="text-xl font-bold">
                  {stats.peakHour.label}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyReservationsChart data={stats.dailyStats} />
            <StatusDistributionChart data={stats.statusDistribution} />
          </div>

          <HourlyDistributionChart data={stats.hourlyDistribution} />
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          無統計數據
        </div>
      )}
    </div>
  )
}
