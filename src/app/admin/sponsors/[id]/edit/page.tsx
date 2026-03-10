import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SponsorForm from '@/components/forms/SponsorForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSponsorPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢贊助商資料
  const sponsor = await prisma.sponsor.findUnique({
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

  if (!sponsor) {
    redirect('/admin/sponsors')
  }

  // 檢查權限：超級管理員或展覽創建者
  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    sponsor.exhibition.createdBy === session.user.id

  if (!canEdit) {
    redirect(`/admin/sponsors/${id}`)
  }

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">編輯贊助商</h1>
        <p className="text-gray-600 mt-2">
          {sponsor.name} - {sponsor.exhibition.name} ({sponsor.exhibition.year})
        </p>
      </div>

      <SponsorForm
        mode="edit"
        sponsor={{
          id: sponsor.id,
          name: sponsor.name,
          logoUrl: sponsor.logoUrl,
          tier: sponsor.tier,
          websiteUrl: sponsor.websiteUrl,
          contactName: sponsor.contactName,
          contactEmail: sponsor.contactEmail,
          contactPhone: sponsor.contactPhone,
          isContactPublic: sponsor.isContactPublic,
          displayOrder: sponsor.displayOrder,
          exhibitionId: sponsor.exhibitionId,
        }}
      />
    </div>
  )
}
