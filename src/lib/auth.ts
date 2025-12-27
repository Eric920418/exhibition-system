import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// 注意：使用 Credentials Provider 時不應使用 PrismaAdapter
// Credentials Provider 不支持資料庫 session，只能使用 JWT strategy
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
})