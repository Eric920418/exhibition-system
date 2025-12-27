import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, requireAuth } from '@/lib/api-response'

/**
 * GET /api/search
 * 全局搜尋 API - 跨實體搜尋
 *
 * Query params:
 * - q: 搜尋關鍵字（必填）
 * - types: 搜尋的實體類型，逗號分隔（可選，預設搜尋全部）
 *   可選值: exhibitions, artworks, teams, users, sponsors, venues, documents
 * - limit: 每種類型返回的最大數量（可選，預設 5）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const user = requireAuth(session)

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const types = searchParams.get('types')?.split(',') || [
      'exhibitions',
      'artworks',
      'teams',
      'users',
      'sponsors',
      'venues',
      'documents',
    ]
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

    if (!query || query.length < 2) {
      return apiError('搜尋關鍵字至少需要 2 個字元', 400)
    }

    const results: Record<string, unknown[]> = {}

    // 並行執行所有搜尋
    const searchPromises: Promise<void>[] = []

    // 展覽搜尋
    if (types.includes('exhibitions')) {
      searchPromises.push(
        prisma.exhibition
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
              // 非超級管理員只能搜尋自己創建的展覽
              ...(user.role !== 'SUPER_ADMIN' && { createdBy: user.id }),
            },
            select: {
              id: true,
              name: true,
              year: true,
              slug: true,
              status: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.exhibitions = data.map((item) => ({
              ...item,
              type: 'exhibition',
              url: `/admin/exhibitions/${item.id}`,
            }))
          })
      )
    }

    // 作品搜尋
    if (types.includes('artworks')) {
      const artworkWhere: Record<string, unknown> = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { concept: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (user.role !== 'SUPER_ADMIN') {
        if (user.role === 'CURATOR') {
          artworkWhere.team = { exhibition: { createdBy: user.id } }
        } else {
          artworkWhere.team = { leaderId: user.id }
        }
      }

      searchPromises.push(
        prisma.artwork
          .findMany({
            where: artworkWhere,
            select: {
              id: true,
              title: true,
              team: {
                select: {
                  name: true,
                  exhibition: { select: { name: true, year: true } },
                },
              },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.artworks = data.map((item) => ({
              id: item.id,
              title: item.title,
              teamName: item.team.name,
              exhibitionName: item.team.exhibition.name,
              type: 'artwork',
              url: `/admin/artworks/${item.id}`,
            }))
          })
      )
    }

    // 團隊搜尋
    if (types.includes('teams')) {
      const teamWhere: Record<string, unknown> = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (user.role !== 'SUPER_ADMIN') {
        if (user.role === 'CURATOR') {
          teamWhere.exhibition = { createdBy: user.id }
        } else {
          teamWhere.leaderId = user.id
        }
      }

      searchPromises.push(
        prisma.team
          .findMany({
            where: teamWhere,
            select: {
              id: true,
              name: true,
              exhibition: { select: { name: true, year: true } },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.teams = data.map((item) => ({
              id: item.id,
              name: item.name,
              exhibitionName: item.exhibition.name,
              exhibitionYear: item.exhibition.year,
              type: 'team',
              url: `/admin/teams/${item.id}`,
            }))
          })
      )
    }

    // 用戶搜尋（僅 SUPER_ADMIN）
    if (types.includes('users') && user.role === 'SUPER_ADMIN') {
      searchPromises.push(
        prisma.user
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.users = data.map((item) => ({
              ...item,
              type: 'user',
              url: `/admin/users/${item.id}`,
            }))
          })
      )
    }

    // 贊助商搜尋
    if (types.includes('sponsors')) {
      const sponsorWhere: Record<string, unknown> = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { contactName: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (user.role !== 'SUPER_ADMIN') {
        sponsorWhere.exhibition = { createdBy: user.id }
      }

      searchPromises.push(
        prisma.sponsor
          .findMany({
            where: sponsorWhere,
            select: {
              id: true,
              name: true,
              tier: true,
              exhibition: { select: { name: true } },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.sponsors = data.map((item) => ({
              id: item.id,
              name: item.name,
              tier: item.tier,
              exhibitionName: item.exhibition.name,
              type: 'sponsor',
              url: `/admin/sponsors/${item.id}`,
            }))
          })
      )
    }

    // 場地搜尋
    if (types.includes('venues')) {
      const venueWhere: Record<string, unknown> = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (user.role !== 'SUPER_ADMIN') {
        venueWhere.exhibition = { createdBy: user.id }
      }

      searchPromises.push(
        prisma.venue
          .findMany({
            where: venueWhere,
            select: {
              id: true,
              name: true,
              address: true,
              exhibition: { select: { name: true } },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((data) => {
            results.venues = data.map((item) => ({
              id: item.id,
              name: item.name,
              address: item.address || '',
              exhibitionName: item.exhibition.name,
              type: 'venue',
              url: `/admin/venues/${item.id}`,
            }))
          })
      )
    }

    // 文件搜尋
    if (types.includes('documents')) {
      searchPromises.push(
        prisma.document
          .findMany({
            where: {
              title: { contains: query, mode: 'insensitive' },
            },
            select: {
              id: true,
              title: true,
              type: true,
              exhibition: { select: { name: true } },
            },
            take: limit,
            orderBy: { uploadedAt: 'desc' },
          })
          .then((data) => {
            results.documents = data.map((item) => ({
              id: item.id,
              title: item.title,
              documentType: item.type,
              exhibitionName: item.exhibition.name,
              type: 'document',
              url: `/admin/documents/${item.id}`,
            }))
          })
      )
    }

    // 等待所有搜尋完成
    await Promise.all(searchPromises)

    // 計算總數
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    return apiSuccess({
      query,
      totalResults,
      results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
