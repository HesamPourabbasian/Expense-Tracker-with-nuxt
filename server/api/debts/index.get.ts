import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const where: any = { userId: user.id }

  if (query.type) {
    where.type = query.type
  }

  const debts = await prisma.debt.findMany({
    where,
    orderBy: { date: 'desc' }
  })

  return debts
})
