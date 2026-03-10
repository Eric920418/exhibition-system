import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeamForm from '@/components/forms/TeamForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeamPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢團隊資料
  const team = await prisma.team.findUnique({
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

  if (!team) {
    redirect('/admin/teams')
  }

  // 檢查權限：超級管理員、展覽創建者、或團隊組長
  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    team.exhibition.createdBy === session.user.id ||
    team.leaderId === session.user.id

  if (!canEdit) {
    redirect(`/admin/teams/${id}`)
  }

  // 獲取可以當組長的用戶（TEAM_LEADER 角色）
  const leaders = await prisma.user.findMany({
    where: {
      role: 'TEAM_LEADER',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">編輯團隊</h1>
        <p className="text-gray-600 mt-2">
          {team.name} - {team.exhibition.name} ({team.exhibition.year})
        </p>
      </div>

      <TeamForm
        mode="edit"
        team={{
          id: team.id,
          name: team.name,
          slug: team.slug,
          leaderId: team.leaderId,
          description: team.description,
          displayOrder: team.displayOrder,
          exhibitionId: team.exhibitionId,
        }}
        leaders={leaders}
      />
    </div>
  )
}
