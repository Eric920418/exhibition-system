import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function Home() {
  // 檢查系統設置：前台是否開放
  const frontendSetting = await prisma.systemSetting.findUnique({
    where: { key: 'frontend_enabled' },
  })

  const isFrontendEnabled = frontendSetting?.value ? (frontendSetting.value as { enabled: boolean }).enabled : false

  // 如果前台未開放，顯示籌備中頁面
  if (!isFrontendEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4 relative">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <div className="inline-block p-6 bg-white bg-opacity-10 rounded-full mb-6">
              <svg
                className="w-24 h-24 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            展覽籌備中
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-4">
            我們正在精心準備精彩的展覽內容
          </p>
          <p className="text-lg text-blue-200 mb-8">
            敬請期待，即將為您呈現
          </p>
        </div>
      </div>
    )
  }

  // 顯示展覽列表
  const exhibitions = await prisma.exhibition.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { year: 'desc' },
    include: {
      _count: {
        select: {
          teams: true,
          sponsors: true,
          venues: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">展覽管理系統</h1>
              <p className="text-gray-600 mt-1">探索精彩的展覽與作品</p>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                href="/artworks"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                作品集
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {exhibitions.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                正在展出
              </h2>
              <p className="text-gray-600">
                目前共有 {exhibitions.length} 個展覽開放參觀
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {exhibitions.map((exhibition) => (
                <Card
                  key={exhibition.id}
                  className="hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
                >
                  {/* 展覽圖片區域 */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-6xl font-bold opacity-50">{exhibition.year}</p>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl">{exhibition.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {exhibition.description || '暢遊精彩的展覽作品'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {exhibition._count.teams}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">參展團隊</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {exhibition._count.sponsors}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">贊助單位</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {exhibition._count.venues}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">展覽場地</p>
                      </div>
                    </div>

                    {/* 展期資訊 */}
                    {(exhibition.startDate || exhibition.endDate) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <svg
                            className="inline w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {exhibition.startDate && new Date(exhibition.startDate).toLocaleDateString('zh-TW')}
                          {exhibition.startDate && exhibition.endDate && ' - '}
                          {exhibition.endDate && new Date(exhibition.endDate).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Link href={`/exhibitions/${exhibition.slug}`} className="w-full">
                      <Button className="w-full" variant="default">
                        查看展覽
                        <svg
                          className="ml-2 w-4 h-4"
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
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg shadow-lg p-12 max-w-md mx-auto">
              <svg
                className="w-24 h-24 text-gray-300 mx-auto mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                目前沒有展覽
              </h3>
              <p className="text-gray-600 mb-8">
                尚未有公開的展覽，請稍後再來查看
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2026 元智大學資訊傳播學系畢業製作</p>
          </div>
        </div>
      </footer>
    </div>
  )
}