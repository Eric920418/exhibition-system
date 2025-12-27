import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // 公開路由
  const publicRoutes = ['/', '/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // 管理後台路由
  const isAdminRoute = pathname.startsWith('/admin')

  // 如果是管理後台路由且未登入，重定向到登入頁面
  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 如果已登入且訪問登入/註冊頁面，重定向到管理後台
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}