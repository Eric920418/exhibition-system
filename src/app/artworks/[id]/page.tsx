import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import '@/styles/scroll-animations.css'
import { scrollAnimate } from '@/lib/scroll-animations'

interface PageProps {
  params: Promise<{ id: string }>
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const artwork = await prisma.artwork.findUnique({
    where: { id, isPublished: true },
    select: { title: true, concept: true, thumbnailUrl: true },
  })

  if (!artwork) return { title: '作品不存在' }

  return {
    title: `${artwork.title} — 展覽`,
    description: artwork.concept ?? undefined,
    openGraph: {
      title: `${artwork.title} — 展覽`,
      description: artwork.concept ?? undefined,
      images: artwork.thumbnailUrl ? [{ url: artwork.thumbnailUrl }] : undefined,
    },
  }
}

export default async function ArtworkDetailPage({ params }: PageProps) {
  const { id } = await params

  const artwork = await prisma.artwork.findUnique({
    where: { id, isPublished: true },
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

  if (!artwork) notFound()

  const primaryUrl = artwork.thumbnailUrl ?? artwork.mediaUrls[0] ?? null
  const additionalMedia = artwork.thumbnailUrl
    ? artwork.mediaUrls
    : artwork.mediaUrls.slice(1)

  const exhibition = artwork.team?.exhibition

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link
            href="/artworks"
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="返回作品集"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-neutral-200 text-sm">/</span>
          <Link
            href="/artworks"
            className="text-xs tracking-widest uppercase text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            作品集
          </Link>
          <span className="text-neutral-200 text-sm">/</span>
          <span className="text-xs tracking-widest uppercase text-neutral-900 truncate max-w-xs">
            {artwork.title}
          </span>
        </div>
      </header>

      {/* Hero Media */}
      {primaryUrl && (
        <section className="bg-neutral-50 flex items-center justify-center py-12 px-6">
          <div className="max-w-5xl w-full" {...scrollAnimate('scale-reveal')}>
            {isVideo(primaryUrl) ? (
              <video
                src={primaryUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full max-h-[70vh] object-contain mx-auto block"
              />
            ) : (
              <img
                src={primaryUrl}
                alt={artwork.title}
                className="w-full max-h-[70vh] object-contain mx-auto block"
              />
            )}
          </div>
        </section>
      )}

      {/* Info Grid */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: metadata */}
          <div {...scrollAnimate('fade-in-up')}>
            {exhibition && (
              <p className="text-xs tracking-widest uppercase text-neutral-400 mb-4">
                <Link
                  href={`/artworks?exhibition=${exhibition.id}`}
                  className="hover:text-neutral-900 transition-colors"
                >
                  {exhibition.name} {exhibition.year}
                </Link>
              </p>
            )}
            <h1 className="text-3xl font-light text-neutral-900 leading-snug mb-3">
              {artwork.title}
            </h1>
            {artwork.creator?.name && (
              <p className="text-sm text-neutral-500 font-light">{artwork.creator.name}</p>
            )}

            <div className="my-8 border-t border-neutral-100" />

            {artwork.team && (
              <p className="text-xs tracking-widest uppercase text-neutral-400">
                {artwork.team.name}
              </p>
            )}

            <Link
              href="/artworks"
              className="inline-flex items-center gap-2 mt-8 text-xs tracking-widest uppercase text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              返回作品集
            </Link>
          </div>

          {/* Right: concept */}
          <div className="lg:col-span-2" {...scrollAnimate('accordion')}>
            <p className="text-xs tracking-widest uppercase text-neutral-400 mb-6">
              藝術家陳述
            </p>
            {artwork.concept ? (
              <p className="text-lg font-light text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {artwork.concept}
              </p>
            ) : (
              <p className="text-lg font-light text-neutral-300 italic">— 無說明 —</p>
            )}
          </div>
        </div>
      </section>

      {/* Additional Media */}
      {additionalMedia.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-24">
          <div className="border-t border-neutral-100 pt-12">
            <p className="text-xs tracking-widest uppercase text-neutral-400 mb-8">
              更多媒體
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {additionalMedia.map((url, i) => (
                <div
                  key={url}
                  data-animate="fade-in-up"
                  data-animate-delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}
                >
                  {isVideo(url) ? (
                    <video
                      src={url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      className="w-full object-cover"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`${artwork.title} — 媒體 ${i + 1}`}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 text-center">
          <p className="text-xs text-neutral-400 tracking-widest uppercase">
            © {new Date().getFullYear()} 展覽管理系統
          </p>
        </div>
      </footer>
    </div>
  )
}
