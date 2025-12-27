'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface QueueStats {
  waiting: number
  called: number
  completed: number
  noShow: number
  avgWaitMinutes: number
}

interface QueueControlPanelProps {
  stats: QueueStats
  onCallNext: () => void
  loading?: boolean
  disabled?: boolean
}

export function QueueControlPanel({
  stats,
  onCallNext,
  loading = false,
  disabled = false,
}: QueueControlPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>叫號控制</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          size="lg"
          className="w-full h-16 text-xl"
          onClick={onCallNext}
          disabled={loading || disabled || stats.waiting === 0}
        >
          {loading ? '處理中...' : '叫下一位'}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
              <span className="text-sm">等待中</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {stats.waiting}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm">平均等候</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {stats.avgWaitMinutes} 分
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">已完成</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
              {stats.completed}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">未到場</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
              {stats.noShow}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
