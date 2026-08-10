import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const where: any = { userId: user.id }

  if (query.type) {
    where.type = query.type
  }

  const transactions = await prisma.cashTransaction.findMany({
    where,
    orderBy: { date: 'desc' }
  })

  return transactions
})
