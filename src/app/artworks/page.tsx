export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import '@/styles/scroll-animations.css'
import { scrollAnimate, scrollAnimateList } from '@/lib/scroll-animations'

interface PageProps {
  searchParams: Promise<{ exhibition?: string }>
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url)
}

export default async function ArtworksPage({ searchParams }: PageProps) {
  const { exhibition: exhibitionFilter } = await searchParams

  // Fetch all published exhibitions for filter pills
  const exhibitions = await prisma.exhibition.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { year: 'desc' },
    select: { id: true, name: true, year: true },
  })

  // Build where clause
  const where: Record<string, unknown> = { isPublished: true }
  if (exhibitionFilter) {
    where.team = { exhibition: { id: exhibitionFilter } }
  }

  const artworks = await prisma.artwork.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      concept: true,
      conceptShort: true,
      thumbnailUrl: true,
      mediaUrls: true,
      team: {
        select: {
          name: true,
          exhibition: { select: { id: true, name: true, year: true, slug: true } },
        },
      },
      creator: { select: { name: true } },
    },
  })

  // No scroll-driven animation on cards — too many elements cause scroll jank
  const animatedArtworks = artworks.map((item) => ({ props: {}, item }))

  return (
    <div className="min-h-screen bg-[#fff4f1]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[rgba(52,58,64,0.12)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <nav className="flex items-center gap-8">
            <Link
              href="/artworks"
              className="text-sm font-medium text-[#f19d2f] border-b-2 border-[#f19d2f] pb-0.5"
            >
              展覽作品
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-[#212529] hover:text-[#f19d2f] transition-colors duration-150"
            >
              展覽
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Band */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
          <h1
            className="text-4xl font-medium text-[#333] tracking-tight"
            {...scrollAnimate('blur-in')}
          >
            展覽作品
          </h1>
          <p className="mt-3 text-sm text-[#828282] font-light">
            {artworks.length} 件作品
            {exhibitionFilter && exhibitions.find((e) => e.id === exhibitionFilter)
              ? ` — ${exhibitions.find((e) => e.id === exhibitionFilter)!.name}`
              : ''}
          </p>
        </div>
      </section>

      {/* Filter Pills */}
      {exhibitions.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-wrap gap-3">
          <Link
            href="/artworks"
            className={`px-5 py-2 text-sm rounded-[16px] border transition-all duration-150 ${
              !exhibitionFilter
                ? 'bg-[#00BCD4] text-white border-[#00BCD4] shadow-md font-medium'
                : 'bg-white text-[#4f4f4f] border-[rgba(52,58,64,0.12)] hover:border-[#00BCD4] hover:text-[#00BCD4] hover:shadow-sm font-light'
            }`}
          >
            全部
          </Link>
          {exhibitions.map((ex) => (
            <Link
              key={ex.id}
              href={`/artworks?exhibition=${ex.id}`}
              className={`px-5 py-2 text-sm rounded-[16px] border transition-all duration-150 ${
                exhibitionFilter === ex.id
                  ? 'bg-[#00BCD4] text-white border-[#00BCD4] shadow-md font-medium'
                  : 'bg-white text-[#4f4f4f] border-[rgba(52,58,64,0.12)] hover:border-[#00BCD4] hover:text-[#00BCD4] hover:shadow-sm font-light'
              }`}
            >
              {ex.name} {ex.year}
            </Link>
          ))}
        </div>
      )}

      {/* Masonry Grid */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        {artworks.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {animatedArtworks.map(({ props, item: artwork }) => {
              const thumbUrl = artwork.thumbnailUrl ?? artwork.mediaUrls[0] ?? null
              const showVideo = !artwork.thumbnailUrl && thumbUrl && isVideo(thumbUrl)

              return (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  className="block mb-6 break-inside-avoid group bg-white rounded-[12px] overflow-hidden border border-[rgba(52,58,64,0.12)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 will-change-transform"
                  {...props}
                >
                  {/* Media */}
                  {thumbUrl ? (
                    showVideo ? (
                      <video
                        src={thumbUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full object-cover block"
                      />
                    ) : (
                      <Image
                        src={thumbUrl}
                        alt={artwork.title}
                        width={600}
                        height={450}
                        className="w-full object-cover block"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )
                  ) : (
                    <div className="w-full aspect-[4/3] bg-[#fff4f1] flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#828282]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Card Text */}
                  <div className="p-4">
                    <p className="text-[#333] font-medium text-base leading-snug">{artwork.title}</p>
                    {artwork.team?.name && (
                      <p className="text-[#828282] text-sm mt-1 font-light">{artwork.team.name}</p>
                    )}
                    {artwork.conceptShort && (
                      <p className="text-[#4f4f4f] text-sm mt-2 font-light line-clamp-2">{artwork.conceptShort}</p>
                    )}
                    {artwork.team?.exhibition && (
                      <span className="inline-block mt-2 px-3 py-0.5 text-xs font-medium text-[#00BCD4] bg-[#00BCD4]/10 rounded-[8px]">
                        {artwork.team.exhibition.name}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-32 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-4">
              <svg className="w-10 h-10 text-[#828282]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#828282] font-medium">目前沒有作品</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#212529]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 text-center">
          <p className="text-sm text-white/80 font-light">
            © {new Date().getFullYear()} 展覽管理系統
          </p>
        </div>
      </footer>
    </div>
  )
}
