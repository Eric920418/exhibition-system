'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface PageProps {
  params: Promise<{ teamId: string }>
}

interface QueueStatus {
  team: {
    id: string
    name: string
    exhibition: {
      name: string
      year: number
    }
  }
  isOpen: boolean
  operatingHours: {
    start: string
    end: string
  }
  currentServing: {
    sequenceNumber: number
  } | null
  queue: {
    waiting: number
    completed: number
    total: number
  }
  estimatedWaitForNext: number
  config: {
    slotDurationMinutes: number
  }
}

export default function ReservationPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [teamId, setTeamId] = useState<string | null>(null)
  const [status, setStatus] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    notes: '',
  })

  // 解析 params
  useEffect(() => {
    params.then((p) => setTeamId(p.teamId))
  }, [params])

  // 獲取隊列狀態
  useEffect(() => {
    if (!teamId) return

    const fetchStatus = async () => {
      try {
        const data = await apiClient.get<QueueStatus>(
          `/reservations/queue-status/${teamId}`
        )
        setStatus(data)
      } catch (error: any) {
        toast({
          title: '載入失敗',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // 每 30 秒刷新一次
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [teamId, toast])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamId) return

    // 簡單驗證
    if (!formData.visitorName.trim()) {
      toast({
        title: '請輸入姓名',
        variant: 'destructive',
      })
      return
    }

    if (!/^09\d{8}$/.test(formData.visitorPhone)) {
      toast({
        title: '請輸入正確的手機號碼',
        description: '手機號碼應為 09 開頭的 10 位數字',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      const result = await apiClient.post<{
        reservation: {
          id: string
          sequenceNumber: number
          estimatedWaitMinutes: number
          queuePosition: number
        }
        team: {
          name: string
        }
      }>('/reservations', {
        teamId,
        visitorName: formData.visitorName.trim(),
        visitorPhone: formData.visitorPhone,
        reservationDate: today,
        notes: formData.notes.trim() || undefined,
      })

      // 跳轉到成功頁面
      router.push(
        `/reservations/${teamId}/success?` +
          `id=${result.reservation.id}` +
          `&number=${result.reservation.sequenceNumber}` +
          `&wait=${result.reservation.estimatedWaitMinutes}` +
          `&position=${result.reservation.queuePosition}`
      )
    } catch (error: any) {
      toast({
        title: '預約失敗',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-800">載入失敗</h1>
          <Link href="/reservations" className="text-blue-600 hover:underline mt-4 inline-block">
            返回預約列表
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-bold text-gray-900">{status.team.name}</h1>
          <p className="text-gray-500 text-sm">
            {status.team.exhibition.name} ({status.team.exhibition.year})
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 當前狀態卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {status.currentServing?.sequenceNumber || '-'}
              </div>
              <div className="text-sm text-gray-500">目前號碼</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {status.queue.waiting}
              </div>
              <div className="text-sm text-gray-500">等候人數</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-700">
                ~{status.estimatedWaitForNext} 分
              </div>
              <div className="text-sm text-gray-500">預估等候</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            營業時間：{status.operatingHours.start} - {status.operatingHours.end}
            {!status.isOpen && (
              <span className="ml-2 text-red-500">（目前非營業時間）</span>
            )}
          </div>
        </div>

        {/* 預約表單 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">填寫預約資料</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitorName">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitorName"
                name="visitorName"
                type="text"
                value={formData.visitorName}
                onChange={handleChange}
                placeholder="請輸入您的姓名"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitorPhone">
                手機號碼 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitorPhone"
                name="visitorPhone"
                type="tel"
                value={formData.visitorPhone}
                onChange={handleChange}
                placeholder="09xxxxxxxx"
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-500">
                用於查詢預約狀態和接收叫號通知
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備註（選填）</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="如有特殊需求請在此說明"
                rows={2}
                maxLength={500}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? '處理中...' : '確認取號'}
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            取號後請留意叫號進度，錯過叫號將自動取消預約
          </p>
        </div>
      </main>
    </div>
  )
}
