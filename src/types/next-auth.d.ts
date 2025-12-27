import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    avatarUrl: string | null
    isActive: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      avatarUrl?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    name: string
    email: string
  }
}