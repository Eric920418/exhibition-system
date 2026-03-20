import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Set to a specific exhibition slug to target, or leave undefined to use the first exhibition found
const EXHIBITION_SLUG: string | undefined = undefined

const groups = [
  {
    teamName: 'Resonate Collective',
    slug: 'resonate-collective',
    advisor: '陳昱錡老師、邱仁一老師',
    members: ['莊菀萍', '周芷舲', '洪嘉駿', '江語檬', '張家毓', '陳思佑'],
    artworkTitle: '須臾．緩存',
    artworkConcept:
      '在快轉與儲存成為日常的時代， 我們邀請你放慢腳步，以感官與選擇，重新面對生命的倒數， 思考是否留下屬於自己的痕跡， 或讓一切，停留在此刻。',
  },
  {
    teamName: '異鄉的餐桌',
    slug: 'yi-xiang-de-can-zhuo',
    advisor: '邱仁一老師、張家榮老師',
    members: ['鍾承謙', '郭祖文', '謝鈺翔', '蔡翊廉', '卓宇恒', '陳郁璿'],
    artworkTitle: '異鄉的餐桌',
    artworkConcept:
      '《異鄉的餐桌》透過日常互動，呈現印尼看護移工在台灣生活中的時間失序與文化落差，邀請觀眾從生活細節中重新思考理解、尊重與平等的意義。',
  },
  {
    teamName: '聲影審問',
    slug: 'sheng-ying-shen-wen',
    advisor: '張家榮老師',
    members: ['林承頡', '簡靖倫', '宋柏宏', '陳暘', '施景瀚', '林昱賢'],
    artworkTitle: '聲影審問',
    artworkConcept:
      '在審問的過程裡，利用語音對話與手勢辨識來判斷出真兇吧！《聲影審問》邀請您一同進入與AI對話的世界。',
  },
  {
    teamName: 'OverVision Studio',
    slug: 'overvision-studio',
    advisor: '邱仁一老師、鄧進宏老師',
    members: ['李峻宇', '葛芝羽', '江倖衣', '小崎晃志郎', '廖晨皓', '張凱紹'],
    artworkTitle: '觸.zip',
    artworkConcept:
      '"傳得越快，說得越少，感覺更多，還是更少？\n這個答案，或許正藏在每一次「選擇壓縮」的那個瞬間裡。"',
  },
  {
    teamName: 'SUPA Lab',
    slug: 'supa-lab',
    advisor: '黃絜如老師',
    members: ['莊喬茵', '陳幸佑'],
    artworkTitle: 'NOVUS',
    artworkConcept:
      'NOVUS 是一款陪伴大一新生走過適應期的 App，從情緒出發，讓大學生活的起點，有人陪你一起來。',
  },
  {
    teamName: '奴隸牌',
    slug: 'nu-li-pai',
    advisor: '方文聘老師',
    members: ['賴芷言', '齋藤萌實', '蔡辰熙', '邱承澤'],
    artworkTitle: '奴隸牌',
    artworkConcept:
      '《奴隸牌》是一款策略卡牌角色扮演手遊。玩家將扮演競技場奴隸，以撲克牌的形式進行戰鬥，並收集打賞購買裝備。\n\n奴隸啊...成為競技場之王吧!',
  },
  {
    teamName: '粉紅怪獸製造所',
    slug: 'fen-hong-guai-shou',
    advisor: '陳麗秋老師、張韶宸老師',
    members: ['劉芯婷', '陳品維', '許芮慈', '陳衍甫', '李柏逸', '葉安桁'],
    artworkTitle: 'Drive-inLove',
    artworkConcept:
      '當情感淪為商品，本作品以「點餐機」隱喻交友軟體。透過結合情感測試的互動裝置，諷刺當代追求快速、即取即用的「速食愛情」文化。',
  },
  {
    teamName: '你前面有車',
    slug: 'ni-qian-mian-you-che',
    advisor: '黃絜如老師、陳昱錡老師',
    members: ['蕭聖宏', '黃凱琳', '康承宇', '曾耘皓', '周晉維'],
    artworkTitle: '你前面有車',
    artworkConcept:
      '當「滑手機」成為本能，長時間維持專注竟成現代人面臨的最大挑戰。 「你前面有車」打破傳統駕駛模擬框架，打造一場荒謬且充滿驚喜的駕駛旅程，找回資訊過載時代中遺失的專注力。',
  },
  {
    teamName: '怎麼這樣字',
    slug: 'zen-me-zhe-yang-zi',
    advisor: '陳彥彰老師、張家榮老師',
    members: ['林煜宸', '陳俊宇', '張宏鈞', '王詮盛'],
    artworkTitle: '怎麼這樣字',
    artworkConcept:
      '以互動裝置把生僻字變為可觸碰、可聆聽的體驗，《怎麼這樣字》將引領觀眾，重新感受漢字的造形之美與文化記憶。',
  },
  {
    teamName: '雙眼無神工作室',
    slug: 'shuang-yan-wu-shen',
    advisor: '方文聘老師、陳昱錡老師',
    members: ['吳金玲', '楊凱全', '鄭錡樺', '張栢碩', '蔡東廷', '鍾曜蓬'],
    artworkTitle: '無神之國的倪斯',
    artworkConcept: '《無神之國的倪斯》是一款劇情導向的 2D 旅行戰鬥遊戲。',
  },
  {
    teamName: '從前有個工作室',
    slug: 'cong-qian-you-ge',
    advisor: '張韶宸老師、張世明老師',
    members: ['葉珈彤', '孫俐淇', '張翔喻', '林芯妤', '張昶勛'],
    artworkTitle: '童話深淵',
    artworkConcept:
      '受困於扭曲的童話世界，唯有策略是你的武器。\n透過卡牌策略對抗強敵，在驚險戰鬥中做出抉擇。\n你，能逃回現實嗎？',
  },
  {
    teamName: 'RESeTROOM',
    slug: 'resetroom',
    advisor: '陳彥章老師、陳昱錡老師',
    members: ['王祐綺', '楊蓁蓁', '蔣冠翔', '謝允凡', '王文伶', '張君葳'],
    artworkTitle: 'RESeTROOM',
    artworkConcept:
      '本作品以廁所作為觀察現代生活壓力的起點，透過互動與感官體驗，重新思考私密空間中「放鬆」與「控制」的關係，引導觀眾在短暫停留中，找回對生活節奏的主導權。',
  },
  {
    teamName: '魚頭隊',
    slug: 'yu-tou-dui',
    advisor: '張世明老師',
    members: ['陳佳佑', '何珮瑄', '羅際泓', '陳凱文', '陳禹安'],
    artworkTitle: '青蛙下蛋',
    artworkConcept:
      '一隻青蛙，失去了母親與森林。 \n一個吻，讓他變成理想中的樣子 ，獲得了愛與力量，踏入慾望的核心。\n性愛、暴力與幻想交纏，形成一場失控而黏膩的惡夢。',
  },
  {
    teamName: '五女一男工作室',
    slug: 'wu-nv-yi-nan',
    advisor: '陳麗秋老師、張韶宸老師',
    members: ['鄭騏萱', '廖羽歆', '黃寧鈞', '陳建強', '伍奕潔', '官昕'],
    artworkTitle: '爆改人生',
    artworkConcept:
      '「爆改人生」為遊戲化展覽，提供零門檻裝置與異想天開配件，親手翻玩街頭美學。快來一起爆改到緊繃！',
  },
  {
    teamName: '唐人街工作室',
    slug: 'tang-ren-jie',
    advisor: '張韶宸老師',
    members: ['古承翰', '沈宜叡', '梁佑民', '王鈺筌', '王晴右', '王子維'],
    artworkTitle: '逆衍者',
    artworkConcept:
      '《逆衍者》是一款以武俠修行為背景的策略卡牌遊戲。玩家作為宗門滅門後的唯一倖存者，踏上復仇之路，成為逆轉天命的關鍵變數。',
  },
  {
    teamName: 'S•Y•Z',
    slug: 'syz',
    advisor: '張世明老師',
    members: ['馮詩穎', '胥姿妤', '陳宥榛'],
    artworkTitle: '是女兒，也是接班人',
    artworkConcept:
      '本片記錄一位女性在接班過程中，於家庭與職場之間不斷切換角色的狀態，透過父母與同輩截然不同的眼光，呈現她如何在多重期待中逐步找到自己的位置。',
  },
  {
    teamName: '被迫營業中',
    slug: 'bei-po-ying-ye',
    advisor: '張韶宸老師',
    members: ['張家樺', '陳柏達', '黃亦妙', '蘇竣韋', '魏宏達'],
    artworkTitle: 'Faraway',
    artworkConcept:
      '《Faraway》是一款橫向卷軸像素冒險遊戲。\n玩家將扮演年輕的藥師「梅莉」，\n為了尋找治癒母親的方法，從而踏上未知的旅程...',
  },
  {
    teamName: '沒怒用工作室',
    slug: 'mei-nu-yong',
    advisor: '方文聘老師、邱仁一老師',
    members: ['蔡珮婷', '林韋翔', '林芷安', '洪冠宇', '張玉英'],
    artworkTitle: '隱 yǐn',
    artworkConcept:
      '在資訊洪流中，注意力悄悄分散，感受變得遲鈍；本作品邀請參展者在流動⟷停頓、模糊⟷清晰間切換，找回專注與平衡。',
  },
  {
    teamName: 'MY',
    slug: 'my',
    advisor: '陳麗秋老師、陳昱錡老師',
    members: ['陳囿臻', '周益成', '黃莉淇', '蕭媛', '吳景瑄', '邱梓芫'],
    artworkTitle: "It's Mine",
    artworkConcept:
      '玩家將進入一座實驗室中，扮演身分混亂的間諜，互相干擾、偷竊和誤導，目的是完成自己任務以獲得勝利。',
  },
]

async function main() {
  // 1. Find target exhibition
  const exhibition = await prisma.exhibition.findFirst({
    where: EXHIBITION_SLUG ? { slug: EXHIBITION_SLUG } : undefined,
    orderBy: { createdAt: 'asc' },
  })

  if (!exhibition) {
    console.error('找不到展覽，請確認資料庫中有展覽資料，或設定 EXHIBITION_SLUG 變數')
    process.exit(1)
  }

  console.log(`目標展覽: ${exhibition.name} (${exhibition.slug})`)

  // 2. Delete all existing teams for this exhibition (cascades to members and artworks)
  const deleted = await prisma.team.deleteMany({
    where: { exhibitionId: exhibition.id },
  })
  console.log(`已清除 ${deleted.count} 個舊團隊（及其成員與作品）`)

  // 3. Import new groups
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]

    const team = await prisma.team.create({
      data: {
        name: group.teamName,
        slug: group.slug,
        exhibitionId: exhibition.id,
        advisor: group.advisor,
        displayOrder: i,
        members: {
          create: group.members.map((name, order) => ({
            name,
            displayOrder: order,
          })),
        },
        artworks: {
          create: [
            {
              title: group.artworkTitle,
              concept: group.artworkConcept,
              isPublished: true,
              displayOrder: 0,
            },
          ],
        },
      },
    })

    console.log(`✓ [${i + 1}/19] ${group.artworkTitle} — ${team.name}`)
  }

  console.log('')
  console.log('========================================')
  console.log('匯入完成！共 19 組資料')
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
