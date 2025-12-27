'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface ReservationStatus {
  id: string
  sequenceNumber: number
  visitorName: string
  status: string
  statusText: string
  queuePosition: number | null
  estimatedWaitMinutes: number | null
  currentServing: {
    sequenceNumber: number
  } | null
  calledAt: string | null
  completedAt: string | null
  createdAt: string
  team: {
    id: string
    name: string
    exhibition: {
      name: string
      year: number
    }
  }
  canCancel: boolean
}

export default function ReservationStatusPage() {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<ReservationStatus[] | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^09\d{8}$/.test(phone)) {
      toast({
        title: '請輸入正確的手機號碼',
        description: '手機號碼應為 09 開頭的 10 位數字',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const result = await apiClient.get<{ reservations: ReservationStatus[] }>(
        `/reservations/my-status?phone=${phone}`
      )
      setReservations(result.reservations)

      if (result.reservations.length === 0) {
        toast({
          title: '沒有找到預約',
          description: '請確認手機號碼是否正確',
        })
      }
    } catch (error: any) {
      if (error.status === 404) {
        setReservations([])
        toast({
          title: '沒有找到預約',
          description: '今日沒有使用此手機號碼的預約記錄',
        })
      } else {
        toast({
          title: '查詢失敗',
          description: error.message,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (reservationId: string) => {
    if (!confirm('確定要取消此預約嗎？')) return

    try {
      await apiClient.delete(`/reservations/${reservationId}?phone=${phone}`)

      toast({
        title: '預約已取消',
      })

      // 重新查詢
      handleSearch({ preventDefault: () => {} } as React.FormEvent)
    } catch (error: any) {
      toast({
        title: '取消失敗',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CALLED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-6">
          <Link
            href="/reservations"
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-900">查詢我的預約</h1>
          <p className="text-gray-500 text-sm">輸入預約時使用的手機號碼</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 查詢表單 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手機號碼</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                maxLength={10}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '查詢中...' : '查詢'}
            </Button>
          </form>
        </div>

        {/* 查詢結果 */}
        {reservations !== null && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-600">今日沒有找到預約記錄</p>
              </div>
            ) : (
              reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* 號碼和狀態 */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm opacity-80">號碼</p>
                      <p className="text-3xl font-bold">
                        {reservation.sequenceNumber.toString().padStart(3, '0')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {reservation.statusText}
                    </span>
                  </div>

                  {/* 詳情 */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">組別</span>
                      <span className="text-gray-900">{reservation.team.name}</span>
                    </div>

                    {reservation.status === 'WAITING' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">目前叫號</span>
                          <span className="text-blue-600 font-medium">
                            {reservation.currentServing?.sequenceNumber || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">前面等候</span>
                          <span className="text-orange-600 font-medium">
                            {reservation.queuePosition
                              ? reservation.queuePosition - 1
                              : 0}{' '}
                            人
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">預估等候</span>
                          <span className="text-gray-900">
                            約 {reservation.estimatedWaitMinutes} 分鐘
                          </span>
                        </div>
                      </>
                    )}

                    {reservation.calledAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">叫號時間</span>
                        <span className="text-gray-900">
                          {new Date(reservation.calledAt).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    {reservation.completedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">完成時間</span>
                        <span className="text-gray-900">
                          {new Date(reservation.completedAt).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    {reservation.canCancel && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancel(reservation.id)}
                      >
                        取消預約
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
