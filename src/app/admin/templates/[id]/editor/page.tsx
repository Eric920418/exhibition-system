import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditorClient from '@/components/editor/EditorClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TemplatEditorPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // 查詢模板
  const template = await prisma.siteTemplate.findUnique({
    where: { id },
    include: {
      exhibition: {
        select: {
          id: true,
          name: true,
          year: true,
          slug: true,
          createdBy: true,
        },
      },
    },
  })

  if (!template) {
    redirect('/admin/templates')
  }

  // 權限檢查
  if (
    session.user.role !== 'SUPER_ADMIN' &&
    template.exhibition.createdBy !== session.user.id
  ) {
    redirect('/admin/templates')
  }

  return (
    <EditorClient
      templateId={template.id}
      templateName={template.name}
      exhibitionSlug={template.exhibition.slug}
      initialState={template.templateJson as Record<string, any>}
      isPublished={template.isPublished}
    />
  )
}
