'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ teamId: string }>
}

export default function ReservationSuccessPage({ params }: PageProps) {
  const searchParams = useSearchParams()
  const [teamId, setTeamId] = useState<string | null>(null)

  const reservationId = searchParams.get('id')
  const sequenceNumber = searchParams.get('number')
  const estimatedWait = searchParams.get('wait')
  const queuePosition = searchParams.get('position')

  useEffect(() => {
    params.then((p) => setTeamId(p.teamId))
  }, [params])

  if (!sequenceNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❓</div>
          <h1 className="text-xl font-semibold text-gray-800">找不到預約資料</h1>
          <Link
            href="/reservations"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            返回預約
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 成功圖標 */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">預約成功！</h1>
        </div>

        {/* 號碼牌 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 號碼 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 text-center">
            <p className="text-sm opacity-80 mb-2">您的號碼</p>
            <div className="text-7xl font-bold tracking-wider">
              {sequenceNumber?.toString().padStart(3, '0')}
            </div>
          </div>

          {/* 詳情 */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">前面等候</span>
              <span className="text-xl font-semibold text-orange-600">
                {queuePosition ? parseInt(queuePosition) - 1 : 0} 人
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">預估等候時間</span>
              <span className="text-xl font-semibold text-gray-900">
                約 {estimatedWait} 分鐘
              </span>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">請注意：</span>
                <br />
                請在附近等候，留意叫號進度。錯過叫號 3 次將自動取消預約。
              </p>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="mt-6 space-y-3">
          <Link href="/reservations/status" className="block">
            <Button variant="outline" className="w-full" size="lg">
              查詢等候進度
            </Button>
          </Link>

          <Link href="/reservations" className="block">
            <Button variant="ghost" className="w-full text-gray-600">
              返回首頁
            </Button>
          </Link>
        </div>

        {/* 提示 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          可使用預約時的手機號碼查詢進度
        </p>
      </div>
    </div>
  )
}
