import Link from 'next/link'
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

  const animatedArtworks = scrollAnimateList(artworks, 'fade-in-up')

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-neutral-900 font-light tracking-wide text-sm hover:text-neutral-500 transition-colors">
            展覽系統
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/artworks"
              className="text-xs tracking-widest uppercase text-neutral-900 border-b border-neutral-900 pb-0.5"
            >
              作品集
            </Link>
            <Link
              href="/"
              className="text-xs tracking-widest uppercase text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              展覽
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Band */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <h1
          className="text-5xl font-light text-neutral-900 tracking-tight"
          {...scrollAnimate('blur-in')}
        >
          作品集
        </h1>
        <p className="mt-3 text-sm text-neutral-400 tracking-wide">
          {artworks.length} 件作品
          {exhibitionFilter && exhibitions.find((e) => e.id === exhibitionFilter)
            ? ` — ${exhibitions.find((e) => e.id === exhibitionFilter)!.name}`
            : ''}
        </p>
      </section>

      {/* Filter Pills */}
      {exhibitions.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-10 flex flex-wrap gap-2">
          <Link
            href="/artworks"
            className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
              !exhibitionFilter
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            全部
          </Link>
          {exhibitions.map((ex) => (
            <Link
              key={ex.id}
              href={`/artworks?exhibition=${ex.id}`}
              className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
                exhibitionFilter === ex.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-neutral-400'
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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {animatedArtworks.map(({ props, item: artwork }) => {
              const thumbUrl = artwork.thumbnailUrl ?? artwork.mediaUrls[0] ?? null
              const showVideo = !artwork.thumbnailUrl && thumbUrl && isVideo(thumbUrl)

              return (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  className="block mb-4 break-inside-avoid group relative overflow-hidden"
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
                      <img
                        src={thumbUrl}
                        alt={artwork.title}
                        className="w-full object-cover block"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="w-full aspect-[4/3] bg-neutral-100" />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white font-light text-lg leading-snug">{artwork.title}</p>
                      {artwork.creator?.name && (
                        <p className="text-white/70 text-xs tracking-widest uppercase mt-1">
                          {artwork.creator.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-neutral-400 font-light tracking-wide">目前沒有作品</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 text-center">
          <p className="text-xs text-neutral-400 tracking-widest uppercase">
            © {new Date().getFullYear()} 展覽管理系統
          </p>
        </div>
      </footer>
    </div>
  )
}
