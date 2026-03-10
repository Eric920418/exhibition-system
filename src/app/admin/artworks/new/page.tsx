import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ArtworkForm from '@/components/forms/ArtworkForm'

interface SearchParams {
  teamId?: string
}

export default async function NewArtworkPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const teamId = params.teamId

  // 如果沒有提供 teamId，顯示團隊選擇頁面
  if (!teamId) {
    // 獲取用戶可以創建作品的團隊
    const teams = await prisma.team.findMany({
      where:
        session.user.role === 'SUPER_ADMIN'
          ? {} // 超級管理員可以看到所有團隊
          : {
              OR: [
                { leaderId: session.user.id }, // 用戶是組長的團隊
                { exhibition: { createdBy: session.user.id } }, // 用戶創建的展覽下的團隊
              ],
            },
      include: {
        exhibition: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        _count: {
          select: {
            artworks: true,
          },
        },
      },
      orderBy: [
        { exhibition: { year: 'desc' } },
        { displayOrder: 'asc' },
      ],
    })

    return (
      <div className="p-4 md:p-8 pt-20 md:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">新增作品</h1>
          <p className="text-gray-600 mt-2">請選擇要添加作品的團隊</p>
        </div>

        {teams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">您目前沒有可以添加作品的團隊</p>
            <a
              href="/admin/teams/new"
              className="text-blue-600 hover:text-blue-900"
            >
              創建新團隊
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <a
                key={team.id}
                href={`/admin/artworks/new?teamId=${team.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {team.exhibition.name} ({team.exhibition.year})
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>已有 {team._count.artworks} 件作品</span>
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 驗證團隊存在並檢查權限
  const team = await prisma.team.findUnique({
    where: { id: teamId },
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
    redirect('/admin/artworks/new')
  }

  // 檢查權限
  const hasPermission =
    session.user.role === 'SUPER_ADMIN' ||
    team.exhibition.createdBy === session.user.id ||
    team.leaderId === session.user.id

  if (!hasPermission) {
    redirect('/admin/artworks/new')
  }

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">新增作品</h1>
        <p className="text-gray-600 mt-2">
          團隊：{team.name} - {team.exhibition.name} ({team.exhibition.year})
        </p>
      </div>

      <ArtworkForm
        mode="create"
        teamId={teamId}
        teamInfo={{
          name: team.name,
          exhibition: { name: team.exhibition.name, year: team.exhibition.year },
        }}
      />
    </div>
  )
}
