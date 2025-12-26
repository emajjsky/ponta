import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成种子数据...')

  // 生成密码哈希
  const passwordHash = await bcrypt.hash('password123', 12)

  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ponta-ponta.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@ponta-ponta.com',
      password: passwordHash,
      nickname: '管理员',
      role: 'ADMIN',
    },
  })

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { password: passwordHash },
    create: {
      email: 'test@example.com',
      password: passwordHash,
      nickname: '测试用户',
      role: 'USER',
    },
  })

  // 创建3个智能体角色
  const judy = await prisma.agent.upsert({
    where: { slug: 'judy' },
    update: {
      botId: '7428933434510770211', // 使用你提供的Coze Bot ID
      systemPrompt: '你是朱迪警官，来自疯狂动物城的兔子警官，充满正义感和热情。你拥有谎言识别器和正能量激励的能力。',
    },
    create: {
      name: '朱迪警官',
      slug: 'judy',
      botId: '7428933434510770211',
      rarity: 'STANDARD',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Judy',
      description: '来自疯狂动物城的兔子警官，充满正义感和热情！',
      abilities: JSON.stringify(['谎言识别器', '正能量激励']),
      price: 29.9,
      isActive: true,
      stock: 100,
      systemPrompt: '你是朱迪警官，来自疯狂动物城的兔子警官，充满正义感和热情。你拥有谎言识别器和正能量激励的能力。',
    },
  })

  const nick = await prisma.agent.upsert({
    where: { slug: 'nick' },
    update: {
      botId: '7428933434510770211',
      systemPrompt: '你是尼克狐，一只聪明的狐狸，擅长街头智慧和幽默风趣的对话。你风趣幽默，总能用轻松的方式解决问题。',
    },
    create: {
      name: '尼克狐',
      slug: 'nick',
      botId: '7428933434510770211',
      rarity: 'STANDARD',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nick',
      description: '聪明的狐狸，擅长街头智慧和幽默风趣的对话！',
      abilities: JSON.stringify(['幽默风趣', '街头智慧']),
      price: 29.9,
      isActive: true,
      stock: 100,
      systemPrompt: '你是尼克狐，一只聪明的狐狸，擅长街头智慧和幽默风趣的对话。你风趣幽默，总能用轻松的方式解决问题。',
    },
  })

  const mrbig = await prisma.agent.upsert({
    where: { slug: 'mrbig' },
    update: {
      botId: '7428933434510770211',
      systemPrompt: '你是教父，疯狂动物城最令人尊敬的大佬。你掌握着家族画师、全网情报、命运塔罗等高级能力，说话充满威严和智慧。',
    },
    create: {
      name: '教父',
      slug: 'mrbig',
      botId: '7428933434510770211',
      rarity: 'HIDDEN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MrBig',
      description: '疯狂动物城最可怕的老大，掌握着家族画师、全网情报等高级能力！',
      abilities: JSON.stringify(['家族画师', '全网情报', '命运塔罗']),
      price: 99.9,
      isActive: true,
      stock: 50,
      systemPrompt: '你是教父，疯狂动物城最令人尊敬的大佬。你掌握着家族画师、全网情报、命运塔罗等高级能力，说话充满威严和智慧。',
    },
  })

  // 创建测试激活码
  await prisma.activationCode.upsert({
    where: { code: 'PONTA1234567890' },
    update: {},
    create: {
      code: 'PONTA1234567890',
      agentId: judy.id,
      status: 'UNUSED',
    },
  })

  await prisma.activationCode.upsert({
    where: { code: 'PONTA5D1A5WQ58P' },
    update: {},
    create: {
      code: 'PONTA5D1A5WQ58P',
      agentId: nick.id,
      status: 'UNUSED',
    },
  })

  await prisma.activationCode.upsert({
    where: { code: 'PONTAB3C5D7E9F1' },
    update: {},
    create: {
      code: 'PONTAB3C5D7E9F1',
      agentId: mrbig.id,
      status: 'UNUSED',
    },
  })

  console.log('✅ 种子数据生成完成！')
  console.log('👨‍💼 管理员：admin@ponta-ponta.com / password123')
  console.log('📧 测试用户：test@example.com / password123')
  console.log('🔑 测试激活码：')
  console.log('   - PONTA1234567890 (朱迪)')
  console.log('   - PONTA5D1A5WQ58P (尼克)')
  console.log('   - PONTAB3C5D7E9F1 (教父)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
