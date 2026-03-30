export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ExhibitionForm from '@/components/forms/ExhibitionForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditExhibitionPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢展覽
  const exhibition = await prisma.exhibition.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      year: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
      posterUrl: true,
      createdBy: true,
    },
  })

  if (!exhibition) {
    redirect('/admin/exhibitions')
  }

  // 檢查權限（僅創建者或 SUPER_ADMIN 可以編輯）
  if (
    session.user.role !== 'SUPER_ADMIN' &&
    exhibition.createdBy !== session.user.id
  ) {
    redirect('/admin/exhibitions')
  }

  // 將 Date 轉換為 string
  const exhibitionData = {
    ...exhibition,
    startDate: exhibition.startDate.toISOString(),
    endDate: exhibition.endDate.toISOString(),
  }

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">編輯展覽</h1>
        <p className="text-gray-600 mt-2">{exhibition.name}</p>
      </div>

      <ExhibitionForm mode="edit" exhibition={exhibitionData} />
    </div>
  )
}
