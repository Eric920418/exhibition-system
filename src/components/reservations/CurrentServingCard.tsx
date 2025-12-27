'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Phone, User } from 'lucide-react'

interface CurrentServingProps {
  currentNumber: number
  reservation?: {
    id: string
    sequenceNumber: number
    visitorName: string
    visitorPhone: string
    calledAt?: string | null
  } | null
  onComplete: (reservationId: string) => void
  onNoShow: (reservationId: string) => void
  onRequeue: (reservationId: string) => void
  loading?: boolean
}

export function CurrentServingCard({
  currentNumber,
  reservation,
  onComplete,
  onNoShow,
  onRequeue,
  loading = false,
}: CurrentServingProps) {
  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>目前服務</span>
          {reservation && (
            <Badge variant="default" className="text-lg px-3 py-1">
              服務中
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservation ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-6xl font-bold text-primary">
                {reservation.sequenceNumber}
              </div>
              <div className="text-lg text-muted-foreground mt-2">號</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.visitorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.visitorPhone}</span>
              </div>
              {reservation.calledAt && (
                <div className="text-muted-foreground">
                  叫號時間：{new Date(reservation.calledAt).toLocaleTimeString('zh-TW')}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={() => onComplete(reservation.id)}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                完成
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onNoShow(reservation.id)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-1" />
                未到
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onRequeue(reservation.id)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                重排
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl font-bold mb-2">{currentNumber || '-'}</div>
            <p>目前無服務中的預約</p>
            <p className="text-sm mt-2">請點擊「叫下一位」開始服務</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
