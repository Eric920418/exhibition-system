import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * 服務端環境變數（不會暴露給客戶端）
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET 至少需要 32 個字元"),
    NEXTAUTH_URL: z.string().url().optional(),

    // Upstash Redis (Vercel KV)
    KV_REST_API_URL: z.string().url().optional(),
    KV_REST_API_TOKEN: z.string().optional(),

    // Vercel Blob
    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // Node 環境
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  /**
   * 客戶端環境變數（必須以 NEXT_PUBLIC_ 開頭）
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },

  /**
   * 執行時環境變數映射
   * 手動指定 process.env 中的變數
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  /**
   * 跳過驗證的條件
   * 在構建階段跳過驗證（因為環境變數可能還未設定）
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
