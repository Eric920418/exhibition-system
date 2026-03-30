export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeamMemberForm from '@/components/forms/TeamMemberForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewTeamMemberPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id: teamId } = await params

  // 查詢團隊信息
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          createdBy: true,
        },
      },
    },
  })

  if (!team) {
    redirect('/admin/teams')
  }

  // 檢查權限（超級管理員、展覽創建者或團隊組長可以添加成員）
  const canAdd =
    session.user.role === 'SUPER_ADMIN' ||
    team.exhibition.createdBy === session.user.id ||
    team.leaderId === session.user.id

  if (!canAdd) {
    redirect(`/admin/teams/${teamId}`)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">添加團隊成員</h1>
        <p className="text-gray-600 mt-2">
          團隊：{team.name} · {team.exhibition.name}
        </p>
      </div>

      <TeamMemberForm
        mode="create"
        teamId={teamId}
        teamName={team.name}
      />
    </div>
  )
}
