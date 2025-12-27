import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * 服務端環境變數（不會暴露給客戶端）
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET 至少需要 32 個字元"),
    NEXTAUTH_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().url(),

    // MinIO (可選)
    MINIO_ENDPOINT: z.string().optional(),
    MINIO_PORT: z.string().optional(),
    MINIO_USE_SSL: z.enum(["true", "false"]).optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    MINIO_BUCKET_NAME: z.string().optional(),

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
    NEXT_PUBLIC_WS_URL: z.string().url(),
  },

  /**
   * 執行時環境變數映射
   * 手動指定 process.env 中的變數
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    REDIS_URL: process.env.REDIS_URL,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  /**
   * 跳過驗證的條件
   * 在構建階段跳過驗證（因為環境變數可能還未設定）
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
