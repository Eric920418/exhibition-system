export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import VenueForm from '@/components/forms/VenueForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditVenuePage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢場地資料
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          createdBy: true,
        },
      },
    },
  })

  if (!venue) {
    redirect('/admin/venues')
  }

  // 檢查權限：超級管理員或展覽創建者
  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    venue.exhibition.createdBy === session.user.id

  if (!canEdit) {
    redirect(`/admin/venues/${id}`)
  }

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">編輯場地</h1>
        <p className="text-gray-600 mt-2">
          {venue.name} - {venue.exhibition.name} ({venue.exhibition.year})
        </p>
      </div>

      <VenueForm
        mode="edit"
        venue={{
          id: venue.id,
          name: venue.name,
          address: venue.address,
          capacity: venue.capacity,
          floorPlanUrl: venue.floorPlanUrl,
          exhibitionId: venue.exhibitionId,
        }}
      />
    </div>
  )
}
