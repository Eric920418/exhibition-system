'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Phone, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface WaitingListProps {
  reservations: Reservation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onPageChange: (page: number) => void
  onCallSpecific: (reservationId: string) => void
  loading?: boolean
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  WAITING: { label: '等待中', variant: 'secondary' },
  CALLED: { label: '已叫號', variant: 'default' },
  IN_PROGRESS: { label: '服務中', variant: 'default' },
  COMPLETED: { label: '已完成', variant: 'outline' },
  CANCELLED: { label: '已取消', variant: 'outline' },
  NO_SHOW: { label: '未到場', variant: 'destructive' },
}

export function WaitingList({
  reservations,
  pagination,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  onCallSpecific,
  loading = false,
}: WaitingListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>等候名單</CardTitle>
            <CardDescription>
              共 {pagination.total} 筆預約
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="WAITING">等待中</SelectItem>
              <SelectItem value="CALLED">已叫號</SelectItem>
              <SelectItem value="COMPLETED">已完成</SelectItem>
              <SelectItem value="NO_SHOW">未到場</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">號碼</TableHead>
                <TableHead>訪客</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    目前沒有預約記錄
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-bold text-lg">
                      {reservation.sequenceNumber}
                    </TableCell>
                    <TableCell>{reservation.visitorName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {reservation.visitorPhone}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[reservation.status]?.variant || 'secondary'}>
                        {statusLabels[reservation.status]?.label || reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reservation.status === 'WAITING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCallSpecific(reservation.id)}
                          disabled={loading}
                        >
                          叫號
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              第 {pagination.page} / {pagination.totalPages} 頁
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
