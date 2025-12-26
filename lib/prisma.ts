import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client 单例
 * 在开发环境中，由于热重载会导致创建多个 Prisma Client 实例，
 * 这会引发 "Too many Prisma Clients are already running" 警告。
 * 因此使用单例模式来确保只有一个 Prisma Client 实例。
 */
const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
