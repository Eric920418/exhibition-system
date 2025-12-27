import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ArtworkForm from '@/components/forms/ArtworkForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArtworkPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢作品
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          exhibition: {
            select: {
              createdBy: true,
            },
          },
        },
      },
    },
  })

  if (!artwork) {
    redirect('/admin/artworks')
  }

  // 檢查權限
  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    artwork.team.exhibition.createdBy === session.user.id ||
    artwork.team.leaderId === session.user.id ||
    artwork.createdBy === session.user.id

  if (!canEdit) {
    redirect(`/admin/artworks/${id}`)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">編輯作品</h1>
        <p className="text-gray-600 mt-2">{artwork.title}</p>
      </div>

      <ArtworkForm mode="edit" artwork={artwork} />
    </div>
  )
}
