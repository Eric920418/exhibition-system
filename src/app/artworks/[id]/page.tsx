export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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

function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const parts = text.split(urlRegex)
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#36a0ff] hover:text-[#7ac0ff] underline break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const artwork = await prisma.artwork.findUnique({
    where: { id, isPublished: true },
    select: { title: true, concept: true, conceptShort: true, thumbnailUrl: true },
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
      conceptShort: true,
      thumbnailUrl: true,
      mediaUrls: true,
      team: {
        select: {
          name: true,
          advisor: true,
          teamType: true,
          members: {
            select: { name: true, role: true, displayOrder: true },
            orderBy: { displayOrder: 'asc' },
          },
          exhibition: { select: { id: true, name: true, year: true, slug: true } },
        },
      },
    },
  })

  if (!artwork) notFound()

  const primaryUrl = artwork.thumbnailUrl ?? artwork.mediaUrls[0] ?? null
  const additionalMedia = artwork.thumbnailUrl
    ? artwork.mediaUrls
    : artwork.mediaUrls.slice(1)

  const exhibition = artwork.team?.exhibition

  return (
    <div className="min-h-screen bg-[#fff4f1]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[rgba(52,58,64,0.12)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link
            href="/artworks"
            className="text-[#828282] hover:text-[#f19d2f] transition-colors duration-150"
            aria-label="返回展覽作品"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-[rgba(52,58,64,0.2)] text-sm">/</span>
          <Link
            href="/artworks"
            className="text-sm text-[#828282] hover:text-[#f19d2f] transition-colors duration-150 font-light"
          >
            展覽作品
          </Link>
          <span className="text-[rgba(52,58,64,0.2)] text-sm">/</span>
          <span className="text-sm font-medium text-[#333] truncate max-w-xs">
            {artwork.title}
          </span>
        </div>
      </header>

      {/* Hero Media */}
      {primaryUrl && (
        <section className="bg-white flex items-center justify-center py-12 px-6">
          <div className="max-w-5xl w-full" {...scrollAnimate('scale-reveal')}>
            {isVideo(primaryUrl) ? (
              <video
                src={primaryUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full max-h-[70vh] object-contain mx-auto block rounded-[15px]"
              />
            ) : (
              <Image
                src={primaryUrl}
                alt={artwork.title}
                width={1200}
                height={800}
                className="w-full max-h-[70vh] object-contain mx-auto block rounded-[15px]"
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            )}
          </div>
        </section>
      )}

      {/* Info Grid */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: metadata */}
          <div className="bg-white rounded-[12px] border border-[rgba(52,58,64,0.12)] p-6" {...scrollAnimate('fade-in-up')}>
            {exhibition && (
              <p className="mb-4">
                <Link
                  href={`/artworks?exhibition=${exhibition.id}`}
                  className="inline-block px-3 py-1 text-xs font-medium text-[#00BCD4] bg-[#00BCD4]/10 rounded-[8px] hover:bg-[#00BCD4]/20 transition-colors duration-150"
                >
                  {exhibition.name} {exhibition.year}
                </Link>
              </p>
            )}
            <h1 className="text-3xl font-medium text-[#333] leading-snug mb-3">
              {artwork.title}
            </h1>

            {artwork.team?.teamType && (
              <p className="text-sm text-[#828282] mt-1 font-light">
                {artwork.team.teamType}
              </p>
            )}

            <div className="my-6 border-t border-[rgba(52,58,64,0.12)]" />

            {artwork.team && (
              <p className="text-sm font-medium text-[#4f4f4f] mb-4">
                {artwork.team.name}
              </p>
            )}

            {artwork.team?.advisor && (
              <div className="mb-4">
                <p className="text-xs font-medium text-[#828282] mb-1">指導老師</p>
                <p className="text-sm text-[#4f4f4f] font-light">{artwork.team.advisor}</p>
              </div>
            )}

            {artwork.team?.members && artwork.team.members.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#828282] mb-2">成員</p>
                <ul className="space-y-1.5">
                  {artwork.team.members.map((member) => (
                    <li key={member.name} className="text-sm text-[#4f4f4f] font-light">
                      {member.name}
                      {member.role && (
                        <span className="text-[#828282] ml-1.5 text-xs">/ {member.role}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href="/artworks"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#00BCD4] text-white text-sm font-medium rounded-[16px] hover:bg-[#009aae] transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              返回展覽作品
            </Link>
          </div>

          {/* Right: concepts */}
          <div className="lg:col-span-2 space-y-6" {...scrollAnimate('accordion')}>
            {/* Short concept */}
            {artwork.conceptShort && (
              <div className="bg-white rounded-[12px] border border-[rgba(52,58,64,0.12)] p-6">
                <p className="text-xs font-medium text-[#828282] mb-4 uppercase tracking-wider">
                  作品簡介
                </p>
                <p className="text-base text-[#4f4f4f] leading-relaxed whitespace-pre-wrap font-light">
                  <Linkify text={artwork.conceptShort} />
                </p>
              </div>
            )}

            {/* Long concept */}
            <div className="bg-white rounded-[12px] border border-[rgba(52,58,64,0.12)] p-6">
              <p className="text-xs font-medium text-[#828282] mb-4 uppercase tracking-wider">
                作品介紹
              </p>
              {artwork.concept ? (
                <p className="text-base text-[#4f4f4f] leading-relaxed whitespace-pre-wrap font-light">
                  <Linkify text={artwork.concept} />
                </p>
              ) : (
                <p className="text-base text-[#828282] italic font-light">— 無說明 —</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Media */}
      {additionalMedia.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-24">
          <p className="text-xs font-medium text-[#828282] mb-8 uppercase tracking-wider">
            更多媒體
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {additionalMedia.map((url, i) => (
              <div
                key={url}
                className="rounded-[15px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white"
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
                  <Image
                    src={url}
                    alt={`${artwork.title} — 媒體 ${i + 1}`}
                    width={800}
                    height={600}
                    className="w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
