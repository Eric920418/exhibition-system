export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeamMemberForm from '@/components/forms/TeamMemberForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢成員信息
  const member = await prisma.teamMember.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          exhibition: {
            select: {
              id: true,
              name: true,
              createdBy: true,
            },
          },
        },
      },
    },
  })

  if (!member) {
    redirect('/admin/teams')
  }

  // 檢查權限
  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    member.team.exhibition.createdBy === session.user.id ||
    member.team.leaderId === session.user.id

  if (!canEdit) {
    redirect(`/admin/teams/${member.teamId}`)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">編輯團隊成員</h1>
        <p className="text-gray-600 mt-2">
          團隊：{member.team.name} · {member.team.exhibition.name}
        </p>
      </div>

      <TeamMemberForm
        mode="edit"
        member={member}
        teamId={member.teamId}
        teamName={member.team.name}
      />
    </div>
  )
}
