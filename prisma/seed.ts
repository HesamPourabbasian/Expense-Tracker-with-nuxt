import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'argon2'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const username = process.env.SEED_USERNAME?.trim()
  const password = process.env.SEED_PASSWORD

  if (!username || !password) {
    throw new Error('SEED_USERNAME and SEED_PASSWORD are required')
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log('User already exists')
    return
  }

  const hashedPassword = await hash(password)

  await prisma.user.create({
    data: {
      username,
      password: hashedPassword
    }
  })

  console.log('Seed user created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
