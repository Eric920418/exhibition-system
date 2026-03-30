export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SponsorDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢贊助商詳情
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          createdBy: true,
        },
      },
    },
  })

  if (!sponsor) {
    redirect('/admin/sponsors')
  }

  const canEdit =
    session.user.role === 'SUPER_ADMIN' ||
    sponsor.exhibition.createdBy === session.user.id

  return (
    <div className="p-8">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">{sponsor.name}</h1>
            {sponsor.tier && (
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                {sponsor.tier}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            {sponsor.exhibition.name} ({sponsor.exhibition.year})
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/sponsors"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/admin/sponsors/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              編輯贊助商
            </Link>
          )}
        </div>
      </div>

      {/* Logo 展示 */}
      {sponsor.logoUrl && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Logo</h2>
          <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg">
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name}
              className="max-h-40 max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">贊助商名稱</h3>
            <p className="text-gray-800">{sponsor.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">贊助等級</h3>
            <p className="text-gray-800">{sponsor.tier || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">所屬展覽</h3>
            <Link
              href={`/admin/exhibitions/${sponsor.exhibition.id}`}
              className="text-blue-600 hover:text-blue-900"
            >
              {sponsor.exhibition.name} ({sponsor.exhibition.year})
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">顯示順序</h3>
            <p className="text-gray-800">{sponsor.displayOrder}</p>
          </div>
          {sponsor.websiteUrl && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">網站</h3>
              <a
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-900"
              >
                {sponsor.websiteUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 聯絡資訊 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">聯絡資訊</h2>
          {sponsor.isContactPublic ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              公開
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              不公開
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">聯絡人姓名</h3>
            <p className="text-gray-800">{sponsor.contactName || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">聯絡人 Email</h3>
            <p className="text-gray-800">
              {sponsor.contactEmail ? (
                <a
                  href={`mailto:${sponsor.contactEmail}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  {sponsor.contactEmail}
                </a>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">聯絡人電話</h3>
            <p className="text-gray-800">
              {sponsor.contactPhone ? (
                <a
                  href={`tel:${sponsor.contactPhone}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  {sponsor.contactPhone}
                </a>
              ) : (
                '-'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
