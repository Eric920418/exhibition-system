'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Settings,
  Monitor,
  PlayCircle,
  RotateCcw,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Team {
  id: string
  name: string
  exhibition: {
    id: string
    name: string
  }
}

interface ReservationConfig {
  id: string
  teamId: string
  isEnabled: boolean
  slotDurationMinutes: number
  concurrentCapacity: number
  openTime: string
  closeTime: string
}

interface QueueStats {
  waiting: number
  called: number
  completed: number
  noShow: number
}

export default function TeamReservationPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [config, setConfig] = useState<ReservationConfig | null>(null)
  const [stats, setStats] = useState<QueueStats>({
    waiting: 0,
    called: 0,
    completed: 0,
    noShow: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [teamRes, configRes, servingRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/reservations/config/${teamId}`),
        fetch(`/api/reservations/serving/${teamId}`),
      ])

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeam(teamData.data)
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData.data)
      }

      if (servingRes.ok) {
        const servingData = await servingRes.json()
        if (servingData.data?.stats) {
          setStats(servingData.data.stats)
        }
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '載入資料失敗',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [teamId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/admin/reset/${teamId}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '重置失敗')
      }

      toast({
        title: '重置成功',
        description: data.message,
      })

      await fetchData()
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '重置失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCleanup = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/reservations/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '清理失敗')
      }

      toast({
        title: '清理完成',
        description: data.message,
      })

      await fetchData()
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '清理失敗',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
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
            <h1 className="text-2xl font-bold">{team?.name} - 預約管理</h1>
            <p className="text-muted-foreground">{team?.exhibition.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config?.isEnabled ? 'default' : 'secondary'}>
            {config?.isEnabled ? '預約已啟用' : '預約未啟用'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">等待中</span>
            </div>
            <div className="text-3xl font-bold">{stats.waiting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">已叫號</span>
            </div>
            <div className="text-3xl font-bold">{stats.called}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">已完成</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">未到場</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.noShow}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operations */}
        <Card>
          <CardHeader>
            <CardTitle>操作</CardTitle>
            <CardDescription>預約相關操作</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button
              className="h-24 flex flex-col gap-2"
              onClick={() => router.push(`/admin/reservations/${teamId}/queue`)}
            >
              <PlayCircle className="h-6 w-6" />
              <span>叫號管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() =>
                window.open(`/reservations/display/${teamId}`, '_blank')
              }
            >
              <Monitor className="h-6 w-6" />
              <span>大螢幕顯示</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => router.push(`/admin/reservations/${teamId}/config`)}
            >
              <Settings className="h-6 w-6" />
              <span>預約設定</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => router.push(`/admin/reservations/${teamId}/stats`)}
            >
              <Users className="h-6 w-6" />
              <span>統計報表</span>
            </Button>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>管理操作</CardTitle>
            <CardDescription>需謹慎使用的管理功能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={actionLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置當日序號
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認重置序號？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作將重置今日的序號計數器至 0。現有預約不受影響，但新預約將從 1 號開始。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    確認重置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={actionLoading || (stats.waiting === 0 && stats.called === 0)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清理未完成預約
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認清理未完成預約？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作將把所有「等待中」和「已叫號」狀態的預約標記為「未到場」。
                    共有 {stats.waiting + stats.called} 筆預約將被處理。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    確認清理
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {config && (
              <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                <div>服務時段：{config.slotDurationMinutes} 分鐘</div>
                <div>同時服務人數：{config.concurrentCapacity} 人</div>
                <div>營業時間：{config.openTime} - {config.closeTime}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
