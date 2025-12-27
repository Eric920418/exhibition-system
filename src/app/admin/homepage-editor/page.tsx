import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HomepageEditorClient from '@/components/editor/HomepageEditorClient'

export default async function HomepageEditorPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // 只有超級管理員可以編輯首頁
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  // 獲取首頁設計
  const homepageSetting = await prisma.systemSetting.findUnique({
    where: { key: 'homepage_design' },
  })

  const initialState = homepageSetting?.value
    ? homepageSetting.value as Record<string, any>
    : null

  return (
    <HomepageEditorClient initialState={initialState} />
  )
}