import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  prisma = new PrismaClient({ adapter })
} else {
  if (!global.__prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
    global.__prisma = new PrismaClient({ adapter })
  }
  prisma = global.__prisma
}

export default prisma
