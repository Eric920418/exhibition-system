export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VenueDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢場地詳情
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          createdBy: true,
        },
      },
    },
  })

  if (!venue) {
    redirect('/admin/venues')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    venue.exhibition.createdBy === session.user.id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{venue.name}</h1>
          <p className="text-gray-600 mt-2">
            {venue.exhibition.name} ({venue.exhibition.year})
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/venues"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/venues/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯場地
            </Link>
          )}
        </div>
      </div>

      {/* 統計卡片 */}
      {venue.capacity && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">容納人數</h3>
          <p className="text-2xl font-bold text-gray-800">{venue.capacity} 人</p>
        </div>
      )}

      {/* 平面圖 */}
      {venue.floorPlanUrl && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">場地平面圖</h2>
          <div className="rounded-lg overflow-hidden">
            <img
              src={venue.floorPlanUrl}
              alt={`${venue.name} 平面圖`}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">場地名稱</h3>
            <p className="text-gray-800">{venue.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">所屬展覽</h3>
            <Link
              href={`/admin/exhibitions/${venue.exhibition.id}`}
              className="text-blue-600 hover:text-blue-900"
            >
              {venue.exhibition.name} ({venue.exhibition.year})
            </Link>
          </div>
          {venue.address && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">地址</h3>
              <p className="text-gray-800">{venue.address}</p>
            </div>
          )}
          {venue.capacity && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">容納人數</h3>
              <p className="text-gray-800">{venue.capacity} 人</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
