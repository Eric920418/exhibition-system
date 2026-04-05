import type { Metadata } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/providers/SessionProvider'
import { Toaster } from '@/components/ui/toaster'

const notoSansTC = Noto_Sans_TC({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export const metadata: Metadata = {
  title: '展覽管理系統',
  description: '專業的展覽作品管理與預約系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={notoSansTC.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}