import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)
  
  const where: any = { userId: user.id }
  
  if (query.bankAccountId) {
    where.bankAccountId = parseInt(query.bankAccountId as string)
  }
  
  if (query.type) {
    where.type = query.type
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { bankAccount: { select: { name: true, icon: true } } },
    orderBy: { date: 'desc' }
  })

  return transactions
})
