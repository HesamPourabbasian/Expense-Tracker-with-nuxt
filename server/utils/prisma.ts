import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
  var __pgPool: pg.Pool | undefined
}

const connectionString = process.env.DATABASE_URL!

if (process.env.NODE_ENV === 'production') {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
} else {
  if (!global.__pgPool) {
    global.__pgPool = new pg.Pool({ connectionString })
  }
  if (!global.__prisma) {
    const adapter = new PrismaPg(global.__pgPool)
    global.__prisma = new PrismaClient({ adapter })
  }
  prisma = global.__prisma
}

export default prisma

