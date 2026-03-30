export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReservationConfigForm from '@/components/reservations/ReservationConfigForm'

interface PageProps {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function ReservationConfigPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  const { teamId } = await params
  const { mode } = await searchParams

  // 只有 SUPER_ADMIN 和 CURATOR 可以設定預約
  if (!['SUPER_ADMIN', 'CURATOR'].includes(user.role)) {
    redirect('/admin/reservations')
  }

  // 獲取組別資訊
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          venueType: true,
          createdBy: true,
        },
      },
      reservationConfig: true,
    },
  })

  if (!team) {
    notFound()
  }

  // 權限檢查
  if (user.role !== 'SUPER_ADMIN' && team.exhibition.createdBy !== user.id) {
    redirect('/admin/reservations')
  }

  const isCreateMode = mode === 'create' || !team.reservationConfig
  const formMode = isCreateMode ? 'create' : 'edit'

  // 格式化現有設定
  const existingConfig = team.reservationConfig
    ? {
        id: team.reservationConfig.id,
        slotDurationMinutes: team.reservationConfig.slotDurationMinutes,
        breakDurationMinutes: team.reservationConfig.breakDurationMinutes,
        maxConcurrentCapacity: team.reservationConfig.maxConcurrentCapacity,
        dailyStartTime: formatTime(team.reservationConfig.dailyStartTime),
        dailyEndTime: formatTime(team.reservationConfig.dailyEndTime),
        isActive: team.reservationConfig.isActive,
      }
    : undefined

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/reservations/settings"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← 返回設定列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {isCreateMode ? '創建預約設定' : '編輯預約設定'}
        </h1>
        <p className="text-gray-500 mt-1">
          {team.exhibition.name} ({team.exhibition.year}) - {team.name}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ReservationConfigForm
          teamId={teamId}
          teamName={team.name}
          exhibitionId={team.exhibition.id}
          venueType={team.exhibition.venueType}
          config={existingConfig}
          mode={formMode}
        />
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
