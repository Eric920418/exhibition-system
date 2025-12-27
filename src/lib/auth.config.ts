import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true,
              isActive: true,
              avatarUrl: true
            }
          })

          if (!user || !user.isActive) return null

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

          if (passwordsMatch) {
            // 不要返回 passwordHash
            const { passwordHash, ...userWithoutPassword } = user
            return userWithoutPassword
          }
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnAdmin) {
        if (isLoggedIn) return true
        return false // 重定向到登入頁面
      }

      return true
    },
    async jwt({ token, user }) {
      // 登入時將用戶資料存入 JWT
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      // 從 JWT 取出資料放入 session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true
}