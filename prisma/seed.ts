import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('創建測試數據...')

  // 1. 創建測試用戶
  const passwordHash = await hash('test123456', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: passwordHash,
      name: '系統管理員',
      role: 'SUPER_ADMIN',
    },
  })
  console.log('創建用戶:', adminUser.email)

  // 2. 創建測試展覽
  const exhibition = await prisma.exhibition.upsert({
    where: { slug: 'test-exhibition-2024' },
    update: {},
    create: {
      name: '2024 測試展覽',
      slug: 'test-exhibition-2024',
      year: 2024,
      description: '這是一個測試展覽',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminUser.id,
    },
  })
  console.log('創建展覽:', exhibition.name)

  // 3. 創建測試團隊
  const team1 = await prisma.team.upsert({
    where: {
      exhibitionId_slug: {
        exhibitionId: exhibition.id,
        slug: 'team-alpha'
      }
    },
    update: {},
    create: {
      name: '測試團隊 A',
      slug: 'team-alpha',
      exhibitionId: exhibition.id,
      leaderId: adminUser.id,
      description: '測試團隊 A 描述',
    },
  })
  console.log('創建團隊:', team1.name)

  const team2 = await prisma.team.upsert({
    where: {
      exhibitionId_slug: {
        exhibitionId: exhibition.id,
        slug: 'team-beta'
      }
    },
    update: {},
    create: {
      name: '測試團隊 B',
      slug: 'team-beta',
      exhibitionId: exhibition.id,
      leaderId: adminUser.id,
      description: '測試團隊 B 描述',
    },
  })
  console.log('創建團隊:', team2.name)

  // 4. 創建預約設定
  await prisma.reservationConfig.upsert({
    where: { teamId: team1.id },
    update: { isActive: true },
    create: {
      teamId: team1.id,
      slotDurationMinutes: 15,
      breakDurationMinutes: 5,
      maxConcurrentCapacity: 1,
      dailyStartTime: new Date('1970-01-01T09:00:00.000Z'),
      dailyEndTime: new Date('1970-01-01T18:00:00.000Z'),
      isActive: true,
    },
  })
  console.log('創建預約設定:', team1.name)

  await prisma.reservationConfig.upsert({
    where: { teamId: team2.id },
    update: { isActive: true },
    create: {
      teamId: team2.id,
      slotDurationMinutes: 20,
      breakDurationMinutes: 5,
      maxConcurrentCapacity: 2,
      dailyStartTime: new Date('1970-01-01T10:00:00.000Z'),
      dailyEndTime: new Date('1970-01-01T17:00:00.000Z'),
      isActive: true,
    },
  })
  console.log('創建預約設定:', team2.name)

  // 5. 初始化 CurrentServing
  await prisma.currentServing.upsert({
    where: { teamId: team1.id },
    update: {},
    create: {
      teamId: team1.id,
      currentSequenceNumber: 0,
    },
  })

  await prisma.currentServing.upsert({
    where: { teamId: team2.id },
    update: {},
    create: {
      teamId: team2.id,
      currentSequenceNumber: 0,
    },
  })

  console.log('')
  console.log('========================================')
  console.log('測試數據創建完成!')
  console.log('========================================')
  console.log('Team A ID:', team1.id)
  console.log('Team B ID:', team2.id)
  console.log('Admin User:', adminUser.email, '/ test123456')
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
