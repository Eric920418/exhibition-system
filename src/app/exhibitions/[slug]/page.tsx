export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TemplateRenderer from '@/components/editor/TemplateRenderer'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// 生成動態 metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const exhibition = await prisma.exhibition.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      year: true,
    },
  })

  if (!exhibition) {
    return {
      title: '展覽不存在',
    }
  }

  return {
    title: `${exhibition.name} - ${exhibition.year}`,
    description: exhibition.description || `${exhibition.name} 展覽網站`,
    openGraph: {
      title: `${exhibition.name} - ${exhibition.year}`,
      description: exhibition.description || `${exhibition.name} 展覽網站`,
      type: 'website',
    },
  }
}

export default async function ExhibitionPage({ params }: PageProps) {
  const { slug } = await params

  // 查詢展覽
  const exhibition = await prisma.exhibition.findUnique({
    where: { slug },
    include: {
      siteTemplates: {
        where: { isPublished: true },
        take: 1,
      },
      teams: {
        include: {
          members: true,
        },
      },
      sponsors: {
        orderBy: { displayOrder: 'asc' },
      },
      venues: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!exhibition) {
    notFound()
  }

  // 檢查展覽狀態
  if (exhibition.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">展覽尚未開放</h1>
          <p className="text-gray-600">此展覽目前尚未公開，請稍後再訪。</p>
        </div>
      </div>
    )
  }

  const publishedTemplate = exhibition.siteTemplates[0]

  // 如果有已發布的自訂模板，使用 Craft.js 渲染
  if (publishedTemplate?.templateJson) {
    const parsedTemplate = JSON.parse(publishedTemplate.templateJson as string)
    return (
      <div className="min-h-screen">
        <TemplateRenderer templateJson={parsedTemplate} />
      </div>
    )
  }

  // 如果沒有自訂模板，顯示預設展覽頁面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">{exhibition.name}</h1>
          <p className="text-xl text-gray-600 mt-2">{exhibition.year} 年</p>
          {exhibition.description && (
            <p className="text-gray-700 mt-4 max-w-3xl">{exhibition.description}</p>
          )}
        </div>
      </header>

      {/* 展覽資訊 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 日期資訊 */}
        {(exhibition.startDate || exhibition.endDate) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">展期資訊</h2>
            <div className="space-y-2">
              {exhibition.startDate && (
                <p className="text-gray-700">
                  <span className="font-medium">開始日期：</span>
                  {new Date(exhibition.startDate).toLocaleDateString('zh-TW')}
                </p>
              )}
              {exhibition.endDate && (
                <p className="text-gray-700">
                  <span className="font-medium">結束日期：</span>
                  {new Date(exhibition.endDate).toLocaleDateString('zh-TW')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 場地資訊 */}
        {exhibition.venues.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">展覽場地</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exhibition.venues.map((venue) => (
                <div key={venue.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{venue.name}</h3>
                  {venue.address && (
                    <p className="text-gray-600 mb-2">{venue.address}</p>
                  )}
                  {venue.capacity && (
                    <p className="text-sm text-gray-500">容納人數：{venue.capacity} 人</p>
                  )}
                  {venue.floorPlanUrl && (
                    <div className="mt-4">
                      <img
                        src={venue.floorPlanUrl}
                        alt={`${venue.name} 平面圖`}
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TODO: 作品展示 - 需要重新設計數據模型或查詢方式 */}

        {/* 贊助商 */}
        {exhibition.sponsors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">贊助單位</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {exhibition.sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex flex-col items-center text-center"
                >
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="w-24 h-24 object-contain mb-3"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}
                  <p className="font-medium text-gray-800">{sponsor.name}</p>
                  {sponsor.websiteUrl && (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-900 mt-1"
                    >
                      官方網站
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
